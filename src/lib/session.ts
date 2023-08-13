import { preprocess, z } from "zod";
import { nanoid } from "nanoid";
import { kv } from "./kv";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import crypto from "node:crypto";

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

  public static async get(sessionCookieID: string) {
    try {
      const verifiedSessionId = await this.#verifySessionId(sessionCookieID);

      const sessionObject = await kv.get(`session:${verifiedSessionId}`);
      if (sessionObject) {
        return Session.#fromPayload(sessionSchema.parse(sessionObject));
      } else {
        return null;
      }
    } catch (error) {
      // In case of invalid Session ID, consider as if the session has not been found
      return null;
    }
  }

  public static async create(isBot: boolean = false) {
    return await Session.#create({
      isBot,
    });
  }

  public async extendValidity() {
    this.#_session.expiry = new Date(
      Date.now() +
        (this.#_session.user
          ? Session.LOGGED_IN_SESSION_TTL
          : Session.LOGGED_OUT_SESSION_TTL) *
          1000
    );
    // saving the session in the storage will reset the TTL
    await Session.#save(this.#_session);
  }

  public getCookie(): ResponseCookie {
    return {
      name: "__session",
      value: `${this.#_session.id}.${this.#_session.signature}`,
      expires: this.#_session.expiry,
      httpOnly: true,
      sameSite: "lax",
      // when testing on local, the cookies should not be set to secure
      secure: process.env.NODE_ENV === "development" ? true : undefined,
    };
  }

  static #fromPayload(serializedPayload: SerializedSession) {
    return new Session(serializedPayload);
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
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(data);
    return hmac.digest("base64");
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
