import type { KVStore } from ".";

type RedisCommand = "GET" | "SET" | "SETEX" | "DEL";

export class WebdisKVStorage implements KVStore {
  /**
   * this function calls the webdis API
   * @param command the command to execute
   * @param args the args to send to the command
   */
  async #fetch<T extends unknown>(
    command: RedisCommand,
    ...args: Array<string | number>
  ) {
    let fullURL =
      `${process.env.REDIS_HTTP_URL!}/${command}/` +
      // encode each argument to be URL friendly & join them to create a string the in the format /arg1/arg2/arg3/…
      args
        .map((arg) => (typeof arg === "string" ? encodeURIComponent(arg) : arg))
        .join("/");

    return await fetch(fullURL, {
      // only the GET command can be executed with the `GET` method
      // & the rest have to use `PUT` because webdis does not support other HTTP methods
      method: command === "GET" ? "GET" : "PUT",
      cache: "no-store",
    }).then(async (r) => {
      return r.json() as T;
    });
  }

  async set<T extends Record<string, any> = {}>(
    key: string,
    value: T,
    ttl_in_seconds?: number | undefined
  ): Promise<void> {
    const serializedValue = JSON.stringify(value);

    if (ttl_in_seconds) {
      await this.#fetch("SETEX", key, ttl_in_seconds, serializedValue);
    } else {
      await this.#fetch("SET", key, serializedValue);
    }
  }

  async get<T extends Record<string, any> = {}>(
    key: string
  ): Promise<T | null> {
    const value = await this.#fetch<{ GET: string | null }>("GET", key);
    return value.GET ? (JSON.parse(value.GET) as T) : null;
  }

  async delete(key: string): Promise<void> {
    await this.#fetch("DEL", key);
  }
}
