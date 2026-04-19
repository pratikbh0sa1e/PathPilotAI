/**
 * Gamification client — calls the Express backend.
 * All state lives in the backend (Supabase or in-memory).
 * Frontend has zero gamification state.
 */

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000";

export async function trackAction(
  userId: string,
  actionId: string,
): Promise<void> {
  if (!userId) return;
  try {
    await fetch(`${BASE}/api/gamification/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, actionId }),
    });
  } catch {
    // Non-blocking — gamification failures should never break the UI
  }
}

export async function getGamification(userId: string) {
  const res = await fetch(
    `${BASE}/api/gamification/${encodeURIComponent(userId)}`,
  );
  if (!res.ok) throw new Error("Failed to load gamification");
  const json = await res.json();
  return json.data;
}
