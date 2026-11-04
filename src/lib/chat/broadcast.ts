import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Publishes a Realtime Broadcast event from the server over HTTP, without
 * opening a websocket. Failures are logged, not thrown: the message is already
 * stored, and clients re-sync on reconnect.
 */
export async function broadcast(topic: string, event: string, payload: unknown): Promise<void> {
  const client = supabaseAdmin();
  const channel = client.channel(topic);
  try {
    await channel.httpSend(event, payload);
  } catch (err) {
    console.error(`[realtime] broadcast to ${topic} failed`, err);
  } finally {
    await client.removeChannel(channel);
  }
}
