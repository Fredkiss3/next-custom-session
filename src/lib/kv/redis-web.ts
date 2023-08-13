import type { KVStore } from ".";

export class WebdisKVStorage implements KVStore {
  async set<T extends Record<string, any> = {}>(
    key: string,
    value: T,
    ttl_in_seconds?: number | undefined
  ): Promise<void> {
    const serializedValue = JSON.stringify(value);

    if (ttl_in_seconds) {
      await fetch(
        `${process.env.REDIS_HTTP_URL!}/SETEX/${encodeURIComponent(
          key
        )}/${ttl_in_seconds}/${encodeURIComponent(serializedValue)}`,
        {
          method: "PUT",
          cache: "no-store",
        }
      );
    } else {
      await fetch(
        `${process.env.REDIS_HTTP_URL!}/SET/${encodeURIComponent(
          key
        )}/${encodeURIComponent(serializedValue)}`,
        {
          method: "PUT",
          cache: "no-store",
        }
      );
    }
  }

  async get<T extends Record<string, any> = {}>(
    key: string
  ): Promise<T | null> {
    return await fetch(
      `${process.env.REDIS_HTTP_URL!}/GET/${encodeURIComponent(key)}`,
      {
        method: "GET",
        cache: "no-store",
      }
    ).then(async (res) => {
      const value = (await res.json()) as { GET: string | null };
      return value.GET ? (JSON.parse(value.GET) as T) : null;
    });
  }

  async delete(key: string): Promise<void> {
    await fetch(
      `${process.env.REDIS_HTTP_URL!}/SET/${encodeURIComponent(key)}`,
      {
        method: "PUT",
        cache: "no-store",
      }
    );
  }
}
