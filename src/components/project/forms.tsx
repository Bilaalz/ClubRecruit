"use client";

import { ActionForm, Button, Card, CardBody, CardHeader, CardTitle, Field, Input, Select, Textarea } from "@/components/ui";
import type { PlanPhase, PlanSubteam, PlanWorkstream, ProjectPlan } from "@/lib/project";
import {
  createPhase,
  createProject,
  createWorkstream,
  deletePhase,
  deleteWorkstream,
  updatePhase,
  updateProject,
  updateWorkstream,
} from "@/lib/project-actions";
import { ConfirmButton } from "./confirm-button";
import { STATUS_LABEL, STATUS_ORDER, toDateInput } from "./shared";

/**
 * Admin forms. Each binds to a server action through <ActionForm>, which
 * renders `{ error }` / `{ success }` inline instead of throwing.
 */

// ───────────────────────── project ─────────────────────────

export function CreateProjectForm({ clubId, clubName }: { clubId: string; clubName: string }) {
  return (
    <Card className="mx-auto max-w-3xl">
      <CardHeader>
        <div>
          <div className="eyebrow mb-1">Get started</div>
          <CardTitle>Create the project plan for {clubName}</CardTitle>
        </div>
      </CardHeader>
      <CardBody>
        <ActionForm action={createProject} className="space-y-5">
          <input type="hidden" name="clubId" value={clubId} />
          <ProjectFields />
          <div className="flex justify-end">
            <Button type="submit">Create project plan</Button>
          </div>
        </ActionForm>
      </CardBody>
    </Card>
  );
}

export function ProjectDetailsForm({ plan }: { plan: ProjectPlan }) {
  return (
    <ActionForm action={updateProject} className="space-y-5">
      <input type="hidden" name="projectId" value={plan.id} />
      <ProjectFields plan={plan} />
      <div className="flex justify-end">
        <Button type="submit" size="sm">
          Save project details
        </Button>
      </div>
    </ActionForm>
  );
}

function ProjectFields({ plan }: { plan?: ProjectPlan }) {
  return (
    <>
      <Field label="Project name">
        <Input name="name" required maxLength={120} defaultValue={plan?.name ?? ""} placeholder="World Cup 2027" />
      </Field>
      <Field label="Summary" hint="One paragraph: what are you building and where does it end up?">
        <Textarea name="summary" required maxLength={2000} defaultValue={plan?.summary ?? ""} />
      </Field>
      <Field label="Goals" hint="One goal per line.">
        <Textarea name="goals" defaultValue={plan?.goals.join("\n") ?? ""} placeholder={"32 teams and 500+ registered players\nEvery match window kicks off on time"} />
      </Field>
      <Field label="Target date">
        <Input type="date" name="targetDate" defaultValue={toDateInput(plan?.targetDate)} className="max-w-xs" />
      </Field>
    </>
  );
}

// ───────────────────────── phases ─────────────────────────

export function PhaseForm({ projectId, phase }: { projectId: string; phase?: PlanPhase }) {
  return (
    <ActionForm action={phase ? updatePhase : createPhase} className="space-y-4">
      {phase ? <input type="hidden" name="phaseId" value={phase.id} /> : <input type="hidden" name="projectId" value={projectId} />}
      <div className="grid gap-4 sm:grid-cols-[1fr_6rem]">
        <Field label="Name">
          <Input name="name" required maxLength={80} defaultValue={phase?.name ?? ""} placeholder="Teams & Partners" />
        </Field>
        {phase && (
          <Field label="Order" hint="Left to right">
            <Input type="number" name="order" min={0} max={9999} defaultValue={phase.order} />
          </Field>
        )}
      </div>
      <Field label="Description">
        <Input name="description" maxLength={300} defaultValue={phase?.description ?? ""} placeholder="Registration, sponsorship, venues." />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Start date">
          <Input type="date" name="startDate" defaultValue={toDateInput(phase?.startDate)} />
        </Field>
        <Field label="End date">
          <Input type="date" name="endDate" defaultValue={toDateInput(phase?.endDate)} />
        </Field>
      </div>
      <div className="flex justify-end">
        <Button type="submit" size="sm">
          {phase ? "Save phase" : "Add phase"}
        </Button>
      </div>
    </ActionForm>
  );
}

export function DeletePhaseForm({ phase }: { phase: PlanPhase }) {
  const n = phase.workstreams.length;
  return (
    <ActionForm action={deletePhase}>
      <input type="hidden" name="phaseId" value={phase.id} />
      <ConfirmButton
        variant="danger"
        size="sm"
        message={
          n
            ? `Delete phase "${phase.name}"? Its ${n} workstream${n === 1 ? "" : "s"} will be kept and shown as Unscheduled.`
            : `Delete phase "${phase.name}"?`
        }
      >
        Delete phase
      </ConfirmButton>
    </ActionForm>
  );
}

// ───────────────────────── workstreams ─────────────────────────

export function WorkstreamForm({
  projectId,
  ws,
  phases,
  subteams,
  all,
  defaultPhaseId,
}: {
  projectId: string;
  ws?: PlanWorkstream;
  phases: PlanPhase[];
  subteams: PlanSubteam[];
  all: PlanWorkstream[];
  defaultPhaseId?: string | null;
}) {
  const others = all.filter((w) => w.id !== ws?.id);
  const phaseName = (id: string | null) => phases.find((p) => p.id === id)?.name ?? "Unscheduled";
  // Group the dependency checklist by phase so long lists stay scannable.
  const groups = [...phases.map((p) => ({ key: p.id, label: p.name, items: others.filter((w) => w.phaseId === p.id) })), { key: "__none", label: "Unscheduled", items: others.filter((w) => !w.phaseId || !phases.some((p) => p.id === w.phaseId)) }].filter((g) => g.items.length);

  return (
    <ActionForm action={ws ? updateWorkstream : createWorkstream} className="space-y-4">
      {ws ? <input type="hidden" name="workstreamId" value={ws.id} /> : <input type="hidden" name="projectId" value={projectId} />}
      <div className="grid gap-4 sm:grid-cols-[1fr_6rem]">
        <Field label="Name">
          <Input name="name" required maxLength={120} defaultValue={ws?.name ?? ""} placeholder="Venues & fixture schedule" />
        </Field>
        <Field label="Order" hint="Top to bottom">
          <Input type="number" name="order" min={0} max={9999} defaultValue={ws?.order ?? ""} placeholder="auto" />
        </Field>
      </div>
      <Field label="Description">
        <Textarea name="description" maxLength={2000} defaultValue={ws?.description ?? ""} className="min-h-[72px]" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Phase">
          <Select name="phaseId" defaultValue={ws?.phaseId ?? defaultPhaseId ?? ""}>
            <option value="">Unscheduled</option>
            {phases.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Subteam">
          <Select name="subteamId" defaultValue={ws?.subteam?.id ?? ""}>
            <option value="">Unassigned</option>
            {subteams.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Status">
          <Select name="status" defaultValue={ws?.status ?? "PLANNED"}>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <fieldset>
        <legend className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-3">Depends on</legend>
        {groups.length === 0 ? (
          <p className="text-xs text-ink-4">No other workstreams to depend on yet.</p>
        ) : (
          <div className="grid gap-x-6 gap-y-3 rounded-sm border border-line-soft bg-cream-2 p-3 sm:grid-cols-2">
            {groups.map((g) => (
              <div key={g.key}>
                <div className="mb-1 text-[11px] uppercase tracking-wide text-ink-4">{g.label}</div>
                <ul className="space-y-1">
                  {g.items.map((w) => (
                    <li key={w.id}>
                      <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <input type="checkbox" name="dependsOn" value={w.id} defaultChecked={ws?.dependsOn.includes(w.id) ?? false} className="h-3.5 w-3.5 accent-ink" />
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: w.subteam?.color ?? "#8a867e" }} aria-hidden />
                        <span className="truncate">{w.name}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
        {ws && ws.phaseId && (
          <p className="mt-1 text-xs text-ink-4">Currently in {phaseName(ws.phaseId)}. Dependencies may cross phases; cycles are rejected.</p>
        )}
      </fieldset>
      <div className="flex justify-end">
        <Button type="submit" size="sm">
          {ws ? "Save workstream" : "Add workstream"}
        </Button>
      </div>
    </ActionForm>
  );
}

export function DeleteWorkstreamForm({ ws }: { ws: PlanWorkstream }) {
  const parts = [
    ws.blockedBy.length ? `${ws.blockedBy.length} workstream${ws.blockedBy.length === 1 ? "" : "s"} depend on it` : null,
    ws.taskTotal ? `${ws.taskTotal} task${ws.taskTotal === 1 ? "" : "s"} will be unlinked (not deleted)` : null,
  ].filter(Boolean);
  return (
    <ActionForm action={deleteWorkstream}>
      <input type="hidden" name="workstreamId" value={ws.id} />
      <ConfirmButton variant="danger" size="sm" message={`Delete workstream "${ws.name}"?${parts.length ? ` ${parts.join("; ")}.` : ""}`}>
        Delete workstream
      </ConfirmButton>
    </ActionForm>
  );
}
