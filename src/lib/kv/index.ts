import { WebdisKVStorage } from "./redis-web";

export interface KVStore {
  /**
   * Set a key, if the ttl is not provided,
   * the value is stored indefinetly, else the value
   * is stored for the amount of time specified by the ttl
   * @param key
   * @param value
   * @param ttl_in_seconds
   */
  set<T extends Record<string, any> = {}>(
    key: string,
    value: T,
    ttl_in_seconds?: number
  ): Promise<void>;
  /**
   * Get the value of a key
   * @param key
   */
  get<T extends Record<string, any> = {}>(key: string): Promise<T | null>;
  /**
   * Delete the value of a key
   * @param key
   */
  delete(key: string): Promise<void>;
}

export const kv: KVStore = new WebdisKVStorage();
