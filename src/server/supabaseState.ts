import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STATE_TABLE = 'admluck_state';
const STATE_ID = 'primary';

interface StateRow<T> {
  state: T;
}

export class SupabaseStateStore<T> {
  private readonly client: SupabaseClient;
  private saveQueue: Promise<void> = Promise.resolve();

  constructor(url: string, secretKey: string) {
    this.client = createClient(url, secretKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }

  async load(): Promise<T | null> {
    const { data, error } = await this.client
      .from(STATE_TABLE)
      .select('state')
      .eq('id', STATE_ID)
      .maybeSingle<StateRow<T>>();

    if (error) {
      throw this.toSetupError(error.message);
    }

    return data?.state ?? null;
  }

  save(state: T): Promise<void> {
    const snapshot = structuredClone(state);

    this.saveQueue = this.saveQueue.catch(() => undefined).then(async () => {
      const { error } = await this.client.from(STATE_TABLE).upsert(
        {
          id: STATE_ID,
          schema_version: 1,
          state: snapshot,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' },
      );

      if (error) {
        throw this.toSetupError(error.message);
      }
    });

    return this.saveQueue;
  }

  private toSetupError(message: string): Error {
    const normalizedMessage = message.toLowerCase();
    const tableIsMissing =
      normalizedMessage.includes('schema cache') ||
      normalizedMessage.includes(`could not find the table 'public.${STATE_TABLE}'`) ||
      normalizedMessage.includes(`relation "public.${STATE_TABLE}" does not exist`);

    if (tableIsMissing) {
      return new Error(
        `Supabase persistence is not initialized. Run supabase/migrations/20260914180000_create_admluck_state.sql in the Supabase SQL Editor. Original error: ${message}`,
      );
    }

    return new Error(`Supabase persistence failed: ${message}`);
  }
}

export const createSupabaseStateStore = <T>(): SupabaseStateStore<T> | null => {
  const url = process.env.SUPABASE_URL?.trim();
  const secretKey =
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url && !secretKey) {
    return null;
  }

  if (!url || !secretKey) {
    throw new Error(
      'Supabase configuration is incomplete. Set SUPABASE_URL and SUPABASE_SECRET_KEY.',
    );
  }

  return new SupabaseStateStore<T>(url, secretKey);
};
