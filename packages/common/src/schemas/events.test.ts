import { describe, expect, it } from "vitest";

import { normalizedEventSchema } from "./events";

describe("normalizedEventSchema", () => {
  it("accepts a valid event", () => {
    const parsed = normalizedEventSchema.parse({
      id: "97f34629-2878-4ea8-a8fe-d5be3f936f05",
      eventId: "85c922af-aa07-43cd-9954-cbf6c3f6ca1b",
      series: "F1",
      type: "LAP_COMPLETED",
      timestamp: "2026-03-02T00:00:00.000Z",
      payload: { lap: 1 }
    });

    expect(parsed.series).toBe("F1");
  });
});
