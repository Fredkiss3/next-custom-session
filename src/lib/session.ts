import { preprocess, z } from "zod";
import { nanoid } from "nanoid";
import { kv } from "./kv";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

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
type RequiredSession = Required<SerializedSession>;
type FlashMessageTypes = keyof RequiredSession["flashMessages"];

export type SessionFlash = {
  type: FlashMessageTypes;
  message: Required<RequiredSession["flashMessages"]>[FlashMessageTypes];
};

export class Session {
  #_session: SerializedSession;
  static LOGGED_OUT_SESSION_TTL = 1 * 24 * 60 * 60; // 1 day in seconds
  static LOGGED_IN_SESSION_TTL = 2 * 24 * 60 * 60; // 2 days in seconds
  static SESSION_COOKIE_KEY = "__session";

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

  async generateForUser(user: { id: number }) {
    // delete the old session
    await Session.#delete(this.#_session);

    // create a new one with a user
    this.#_session = await Session.#create({
      init: {
        flashMessages: this.#_session.flashMessages,
        extras: this.#_session.extras,
        user: {
          id: user.id.toString(),
        },
      },
    });

    await Session.#save(this.#_session);
  }

  public static async create(isBot: boolean = false) {
    return Session.#fromPayload(
      await Session.#create({
        isBot,
      })
    );
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
      name: Session.SESSION_COOKIE_KEY,
      value: `${this.#_session.id}.${this.#_session.signature}`,
      expires: this.#_session.expiry,
      httpOnly: true,
      sameSite: "lax",
      // when testing on local, the cookies should not be set to secure
      secure: process.env.NODE_ENV === "development" ? true : undefined,
    };
  }

  public async addFlash(flash: SessionFlash) {
    if (this.#_session.flashMessages) {
      this.#_session.flashMessages[flash.type] = flash.message;
    } else {
      this.#_session.flashMessages = { [flash.type]: flash.message };
    }

    await Session.#save(this.#_session);
  }

  static async #delete(session: SerializedSession) {
    const verifiedSessionId = await Session.#verifySessionId(
      `${session.id}.${session.signature}`
    );
    await kv.delete(`session:${verifiedSessionId}`);
  }

  public async getFlash() {
    const flashes = this.#_session.flashMessages;

    if (!flashes) {
      return [];
    }

    // delete flashes
    this.#_session.flashMessages = {};
    await Session.#save(this.#_session);

    // Format flashes to be of type Array<{ type: 'success' | 'error' , message: string }>
    const flash = Object.entries(flashes).map(
      ([key, value]) =>
        ({
          type: key,
          message: value,
        } as SessionFlash)
    );

    return flash;
  }

  /**
   * add form data, their type is :
   * ```
   * {
   *  data?: Record<string, any> | null | undefined;
   *  errors?: Record<string, string[]> | null | undefined;
   * } | null
   * ```
   * @param form
   * @returns
   */
  public async addFormData(form: RequiredSession["formData"]) {
    this.#_session.formData = form;
    await Session.#save(this.#_session);
  }

  public async getFormData() {
    const data = this.#_session.formData;

    if (!data) {
      return null;
    }

    // delete formData when accessed
    this.#_session.formData = null;
    await Session.#save(this.#_session);
    return data;
  }

  static #fromPayload(serializedPayload: SerializedSession) {
    return new Session(serializedPayload);
  }

  public get user() {
    return this.#_session.user;
  }

  public async invalidate() {
    // delete the old session
    await Session.#delete(this.#_session);

    // create a new one & pass along flash messages and extra information stored in the session
    this.#_session = await Session.#create({
      init: {
        flashMessages: this.#_session.flashMessages,
        extras: this.#_session.extras,
      },
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
    return sessionObject;
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
