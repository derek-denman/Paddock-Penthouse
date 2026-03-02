import { z } from "zod";

export const normalizedEventSchema = z.object({
  id: z.string().uuid(),
  eventId: z.string().uuid(),
  series: z.enum(["F1", "NASCAR", "INDYCAR", "WEC", "IMSA"]),
  type: z.enum([
    "LAP_COMPLETED",
    "PIT_STOP",
    "FLAG",
    "POSITION_CHANGE",
    "PENALTY",
    "RETIREMENT",
    "SAFETY_CAR",
    "RESTART"
  ]),
  timestamp: z.string().datetime(),
  payload: z.record(z.string(), z.unknown())
});

export type NormalizedEvent = z.infer<typeof normalizedEventSchema>;
