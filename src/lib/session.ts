import { preprocess, z } from "zod";
import { nanoid } from "nanoid";
import { kv } from "./kv";

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
  static LOGGED_OUT_SESSION_TTL = 1 * 24 * 60 * 60; // 1 day in seconds
  static LOGGED_IN_SESSION_TTL = 2 * 24 * 60 * 60; // 2 days in seconds

  private constructor(serializedPayload: SerializedSession) {
    this.#_session = serializedPayload;
  }

  static #fromPayload(serializedPayload: SerializedSession) {
    return new Session(serializedPayload);
  }

  public static async create(isBot: boolean = false) {
    return await Session.#create({
      isBot,
    });
  }

  static async #create(options?: {
    init?: Pick<SerializedSession, "flashMessages" | "extras" | "user">;
    isBot?: boolean;
  }) {
    const { sessionId, signature } = await Session.#generateSessionId();

    const sessionObject = {
      id: sessionId,
      expiry: options?.isBot
        ? new Date(Date.now() + 5 * 1000) // only five seconds for temporary session
        : options?.init?.user
        ? new Date(Date.now() + Session.LOGGED_IN_SESSION_TTL * 1000)
        : new Date(Date.now() + Session.LOGGED_OUT_SESSION_TTL * 1000),
      signature,
      flashMessages: options?.init?.flashMessages,
      extras: options?.init?.extras,
      isBot: Boolean(options?.isBot),
      user: options?.init?.user,
    } satisfies SerializedSession;

    await Session.#save(sessionObject);
    return Session.#fromPayload(sessionObject);
  }

  static async #generateSessionId() {
    const sessionId = nanoid();
    const signature = await this.#sign(sessionId, process.env.SESSION_SECRET!);
    return {
      sessionId,
      signature,
    };
  }

  static async #sign(data: string, secret: string) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const dataToSign = encoder.encode(data);

    const importedKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signature = await crypto.subtle.sign("HMAC", importedKey, dataToSign);

    return this.#arrayBufferToBase64(signature);
  }

  static #arrayBufferToBase64(buffer: ArrayBuffer) {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  static async #save(session: SerializedSession) {
    await Session.#verifySessionId(`${session.id}.${session.signature}`);

    // don't store expiry as a date, but a timestamp instead
    const expiry = session.expiry.getTime();

    let sessionTTL = session.user
      ? Session.LOGGED_IN_SESSION_TTL
      : Session.LOGGED_OUT_SESSION_TTL;
    if (session.isBot) {
      sessionTTL = 5; // only 5 seconds for bot sessions
    }

    await kv.set(`session:${session.id}`, { ...session, expiry }, sessionTTL);
  }

  static async #verifySessionId(signedSessionId: string) {
    const [sessionId, signature] = signedSessionId.split(".");
    const expectedSignature = await this.#sign(
      sessionId,
      process.env.SESSION_SECRET!
    );
    if (signature === expectedSignature) {
      return sessionId;
    } else {
      throw new Error("Invalid session ID");
    }
  }
}
