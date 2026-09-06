"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Button, Label, Textarea } from "@/components/ui";
import { submitInterview } from "@/lib/applications-actions";
import { cn } from "@/lib/cn";

type Props = {
  applicationId: string;
  questions: string[];
  /** One plausible sample answer per question, used to simulate speech-to-text. */
  sampleAnswers: string[];
};

const TYPE_MS = 1500;
const TICK_MS = 40;
const BARS = 28;

export function InterviewRecorder({ applicationId, questions, sampleAnswers }: Props) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>(() => questions.map(() => ""));
  const [recording, setRecording] = useState(false);
  const [recorded, setRecorded] = useState<boolean[]>(() => questions.map(() => false));
  const [elapsed, setElapsed] = useState(0);
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const typerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = questions.length;
  const question = questions[index];
  const answer = answers[index] ?? "";
  const isLast = index === total - 1;

  // Clean up intervals on unmount.
  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (typerRef.current) clearInterval(typerRef.current);
    },
    [],
  );

  function setAnswer(i: number, text: string) {
    setAnswers((prev) => prev.map((a, j) => (j === i ? text : a)));
  }

  function stopTyping() {
    if (typerRef.current) clearInterval(typerRef.current);
    typerRef.current = null;
    setTyping(false);
  }

  function startRecording() {
    setError(null);
    setRecording(true);
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);

    // Simulated speech-to-text: type the sample answer in over ~1.5s, then leave editable.
    const target = sampleAnswers[index] ?? "";
    const startFrom = answer.trim().length > 0 ? answer : "";
    if (!startFrom && target) {
      setTyping(true);
      const steps = Math.max(1, Math.round(TYPE_MS / TICK_MS));
      const perTick = Math.ceil(target.length / steps);
      let shown = 0;
      const current = index;
      typerRef.current = setInterval(() => {
        shown = Math.min(target.length, shown + perTick);
        setAnswer(current, target.slice(0, shown));
        if (shown >= target.length) stopTyping();
      }, TICK_MS);
    }
  }

  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    // If the user stopped mid-typing, finish the text so nothing is cut off.
    if (typerRef.current) {
      stopTyping();
      const target = sampleAnswers[index] ?? "";
      if (target && answer.length < target.length) setAnswer(index, target);
    }
    setRecording(false);
    setRecorded((prev) => prev.map((r, j) => (j === index ? true : r)));
  }

  function goTo(next: number) {
    if (recording) stopRecording();
    setElapsed(0);
    setError(null);
    setIndex(next);
  }

  function finish() {
    if (recording) stopRecording();
    const missing = answers.findIndex((a) => a.trim().length === 0);
    if (missing !== -1) {
      setError(`Question ${missing + 1} has no answer yet.`);
      setIndex(missing);
      return;
    }
    startTransition(async () => {
      const res = await submitInterview(applicationId, answers.map((a) => a.trim()));
      if (res && "error" in res && res.error) setError(res.error);
    });
  }

  const canAdvance = answer.trim().length > 0 && !recording;

  return (
    <div className="space-y-8">
      {/* Question rail */}
      <ol className="flex flex-wrap gap-2">
        {questions.map((_, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => goTo(i)}
              disabled={pending}
              className={cn(
                "inline-flex h-7 min-w-7 items-center justify-center rounded-sm border px-2 text-xs transition-colors",
                i === index ? "border-ink bg-ink text-cream" : answers[i].trim() ? "border-ink text-ink" : "border-line-soft text-ink-4",
              )}
              aria-current={i === index ? "step" : undefined}
            >
              {i + 1}
            </button>
          </li>
        ))}
      </ol>

      <div>
        <div className="eyebrow">
          Question {index + 1} of {total}
        </div>
        <p className="mt-2 font-serif text-2xl leading-snug">{question}</p>
      </div>

      {/* Recording panel */}
      <div className="rounded-md border border-line bg-cream-2 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant={recording ? "danger" : "primary"}
              size="lg"
              onClick={recording ? stopRecording : startRecording}
              disabled={pending}
              className="min-w-32"
            >
              <span
                aria-hidden
                className={cn("inline-block h-2.5 w-2.5 rounded-full", recording ? "animate-pulse bg-cream" : "bg-bad")}
              />
              {recording ? "Stop" : recorded[index] ? "Re-record" : "Record"}
            </Button>
            <span className="font-mono text-xl tabular-nums" aria-live="off">
              {formatTime(elapsed)}
            </span>
          </div>
          <span className="text-xs text-ink-4">
            {recording ? "Recording · transcribing live" : recorded[index] ? "Recorded · edit transcript below if needed" : "Press Record and answer out loud"}
          </span>
        </div>

        {/* Waveform placeholder */}
        <div className="mt-5 flex h-12 items-end gap-1" aria-hidden>
          {Array.from({ length: BARS }).map((_, i) => (
            <span
              key={i}
              className={cn("w-1.5 flex-1 rounded-sm bg-ink transition-opacity", recording ? "wave-bar opacity-100" : "opacity-20")}
              style={{
                height: recording ? undefined : `${18 + ((i * 37) % 45)}%`,
                animationDelay: `${(i % 7) * 90}ms`,
                animationDuration: `${700 + ((i * 53) % 400)}ms`,
              }}
            />
          ))}
        </div>
        <style>{`
          @keyframes cr-wave { 0%,100% { height: 18%; } 50% { height: 100%; } }
          .wave-bar { animation-name: cr-wave; animation-iteration-count: infinite; animation-timing-function: ease-in-out; }
        `}</style>
      </div>

      <div>
        <Label htmlFor="live-transcript">Live transcript</Label>
        <Textarea
          id="live-transcript"
          value={answer}
          onChange={(e) => setAnswer(index, e.target.value)}
          readOnly={typing}
          placeholder="Your answer will appear here as you speak…"
          className="min-h-[160px]"
        />
        <p className="mt-1 text-xs text-ink-4">Demo: speech-to-text is simulated with a sample answer. Edit it freely before moving on.</p>
      </div>

      {error && (
        <p role="alert" className="rounded-sm border border-bad px-3 py-2 text-sm text-bad">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-4 border-t border-line pt-6">
        <Button type="button" variant="ghost" onClick={() => goTo(index - 1)} disabled={index === 0 || pending}>
          ← Previous
        </Button>
        {isLast ? (
          <Button type="button" onClick={finish} disabled={pending || (!canAdvance && answers.some((a) => !a.trim()))}>
            {pending ? "Evaluating your interview…" : "Finish interview"}
          </Button>
        ) : (
          <Button type="button" onClick={() => goTo(index + 1)} disabled={!canAdvance || pending}>
            Next question →
          </Button>
        )}
      </div>
    </div>
  );
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
