/** Small shared bits for stage-2 forms. Server-safe (no hooks). */

type NoticeState = { error?: string; success?: string } | null;

export function FormNotice({ state }: { state: NoticeState }) {
  if (!state?.error && !state?.success) return null;
  return (
    <p
      role="status"
      className={
        state.error
          ? "rounded-sm border border-bad/40 bg-[#f1dede] px-3 py-2 text-sm text-bad"
          : "rounded-sm border border-ok/40 bg-[#e3eee3] px-3 py-2 text-sm text-ok"
      }
    >
      {state.error ?? state.success}
    </p>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-bad">{message}</p>;
}
