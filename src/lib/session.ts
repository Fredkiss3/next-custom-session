import { preprocess, z } from "zod";

const sessionSchema = z.object({
  id: z.string(),
  signature: z.string(),
  expiry: preprocess((arg) => new Date(arg as any), z.date()),
  isBot: z.boolean().optional().default(false),
  user: z
    .object({
      id: z.string(),
    })
    .nullish(),
  flashMessages: z.record(z.enum(["success", "error"]), z.string()).optional(),
  formData: z
    .object({
      data: z.record(z.string(), z.any()).nullish(),
      errors: z.record(z.string(), z.array(z.string())).nullish(),
    })
    .nullish(),
  extras: z.record(z.string(), z.any()).nullish(),
});

export type SerializedSession = z.TypeOf<typeof sessionSchema>;

export class Session {
  #_session: SerializedSession;

  private constructor(serializedPayload: SerializedSession) {
    this.#_session = serializedPayload;
  }

  static #fromPayload(serializedPayload: SerializedSession) {
    return new Session(serializedPayload);
  }
}
