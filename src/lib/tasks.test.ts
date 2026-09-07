import { describe, expect, it } from "vitest";
import { TASK_COLUMNS, toBoardTask } from "./tasks";

const row = {
  id: "t1",
  clubId: "c1",
  workstreamId: "w1",
  assigneeId: "m1",
  title: "Standings table with head-to-head tiebreakers",
  description: "Check the tiebreak order against last season's final table.",
  status: "IN_PROGRESS" as const,
  priority: "HIGH" as const,
  order: 3,
  dueDate: new Date("2026-09-12T00:00:00.000Z"),
  createdAt: new Date("2026-09-01T00:00:00.000Z"),
  updatedAt: new Date("2026-09-02T00:00:00.000Z"),
  workstream: { id: "w1", name: "Registration & standings platform", subteam: { id: "s1", name: "Technology", color: "#4A6B5A" } },
  assignee: { id: "m1", user: { name: "Marcus Lee" } },
};

describe("toBoardTask", () => {
  it("flattens a task row into the shape the board renders", () => {
    expect(toBoardTask(row)).toEqual({
      id: "t1",
      title: "Standings table with head-to-head tiebreakers",
      description: "Check the tiebreak order against last season's final table.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      order: 3,
      dueDate: "2026-09-12T00:00:00.000Z",
      workstream: { id: "w1", name: "Registration & standings platform", subteam: { id: "s1", name: "Technology", color: "#4A6B5A" } },
      assignee: { id: "m1", name: "Marcus Lee" },
    });
  });

  it("serialises dates so the payload can cross to a client component", () => {
    const task = toBoardTask(row);
    expect(typeof task.dueDate).toBe("string");
    expect(JSON.parse(JSON.stringify(task))).toEqual(task);
  });

  it("drops server-only fields", () => {
    const task = toBoardTask(row) as Record<string, unknown>;
    for (const field of ["clubId", "createdAt", "updatedAt", "workstreamId", "assigneeId"]) {
      expect(task).not.toHaveProperty(field);
    }
  });

  it("handles an unscheduled, unassigned, unlinked task", () => {
    const task = toBoardTask({ ...row, dueDate: null, workstream: null, assignee: null });
    expect(task.dueDate).toBeNull();
    expect(task.workstream).toBeNull();
    expect(task.assignee).toBeNull();
  });

  it("keeps a workstream that has no subteam", () => {
    const task = toBoardTask({ ...row, workstream: { id: "w2", name: "Logistics", subteam: null } });
    expect(task.workstream).toEqual({ id: "w2", name: "Logistics", subteam: null });
  });
});

describe("TASK_COLUMNS", () => {
  it("runs backlog → done, left to right", () => {
    expect(TASK_COLUMNS.map((c) => c.status)).toEqual(["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]);
  });

  it("gives every column a label and an empty-state line", () => {
    for (const column of TASK_COLUMNS) {
      expect(column.label).not.toBe("");
      expect(column.empty).not.toBe("");
    }
  });
});
