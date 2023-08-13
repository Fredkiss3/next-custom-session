export interface KVStore {
  set<T extends Record<string, any> = {}>(
    key: string,
    value: T,
    ttl_in_seconds?: number
  ): Promise<void>;
  get<T extends Record<string, any> = {}>(key: string): Promise<T | null>;
  delete(key: string): Promise<void>;
}
// @ts-expect-error
export const kv: KVStore;
