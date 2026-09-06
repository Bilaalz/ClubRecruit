import { describe, expect, it } from "vitest";
import { topoLayout, type PlanWorkstream } from "./project";

function ws(id: string, overrides: Partial<PlanWorkstream> = {}): PlanWorkstream {
  return {
    id,
    name: id,
    description: null,
    status: "PLANNED",
    order: 0,
    phaseId: null,
    subteam: null,
    dependsOn: [],
    blockedBy: [],
    taskTotal: 0,
    taskDone: 0,
    ...overrides,
  };
}

const ids = (items: PlanWorkstream[]) => items.map((w) => w.id);

describe("topoLayout", () => {
  it("returns an empty list unchanged", () => {
    expect(topoLayout([])).toEqual([]);
  });

  it("puts dependencies before the workstreams that depend on them", () => {
    const items = [ws("c", { dependsOn: ["b"] }), ws("a"), ws("b", { dependsOn: ["a"] })];
    expect(ids(topoLayout(items))).toEqual(["a", "b", "c"]);
  });

  it("breaks ties by order, then by name", () => {
    const items = [ws("zebra", { order: 1 }), ws("alpha", { order: 1 }), ws("first", { order: 0 })];
    expect(ids(topoLayout(items))).toEqual(["first", "alpha", "zebra"]);
  });

  it("respects dependencies even when order would say otherwise", () => {
    const items = [ws("dependent", { order: 0, dependsOn: ["blocker"] }), ws("blocker", { order: 9 })];
    expect(ids(topoLayout(items))).toEqual(["blocker", "dependent"]);
  });

  it("ignores dependencies on workstreams outside the set", () => {
    const items = [ws("b", { dependsOn: ["not-in-this-column"] }), ws("a")];
    expect(ids(topoLayout(items))).toEqual(["a", "b"]);
  });

  it("keeps every workstream when there is a dependency cycle", () => {
    const items = [ws("loop-a", { dependsOn: ["loop-b"] }), ws("loop-b", { dependsOn: ["loop-a"] }), ws("free")];
    const result = topoLayout(items);
    expect(result).toHaveLength(3);
    expect(ids(result)).toEqual(["free", "loop-a", "loop-b"]);
  });

  it("emits each workstream exactly once in a diamond graph", () => {
    const items = [
      ws("top"),
      ws("left", { dependsOn: ["top"], order: 1 }),
      ws("right", { dependsOn: ["top"], order: 2 }),
      ws("bottom", { dependsOn: ["left", "right"] }),
    ];
    const result = ids(topoLayout(items));
    expect(result).toEqual(["top", "left", "right", "bottom"]);
    expect(new Set(result).size).toBe(4);
  });

  it("is stable — the same input always lays out the same way", () => {
    const items = [ws("c", { dependsOn: ["a"] }), ws("b", { order: 2 }), ws("a", { order: 1 })];
    expect(ids(topoLayout(items))).toEqual(ids(topoLayout(items)));
  });
});
