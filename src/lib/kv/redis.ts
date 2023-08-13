import type { KVStore } from ".";
import { type RedisClientType, createClient } from "redis";

export class RedisKVStorage implements KVStore {
  #_client: RedisClientType | null = null;

  async #getClient() {
    if (!this.#_client) {
      this.#_client = createClient({ url: process.env.REDIS_URL });
      await this.#_client.connect();
    }
    return this.#_client;
  }

  async set<T extends Record<string, any> = {}>(
    key: string,
    value: T,
    ttl_in_seconds?: number | undefined
  ): Promise<void> {
    const client = await this.#getClient();
    const serializedValue = JSON.stringify(value);
    await client.set(key, serializedValue);

    if (ttl_in_seconds) {
      await client.expire(key, ttl_in_seconds);
    }
  }

  async get<T extends Record<string, any> = {}>(
    key: string
  ): Promise<T | null> {
    const client = await this.#getClient();
    const value = await client.get(key);
    return value ? (JSON.parse(value) as T) : null;
  }

  async delete(key: string): Promise<void> {
    const client = await this.#getClient();
    await client.del(key);
  }
}
