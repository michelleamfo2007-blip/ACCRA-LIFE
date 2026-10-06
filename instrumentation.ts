// Loads the directory from Supabase once the app_store table exists.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  try {
    const { hydrateStore } = await import("@/lib/server/store");
    const { publishPlaces } = await import("@/lib/server/live");
    await hydrateStore();
    await publishPlaces();
  } catch {
    // A directory sync must not stop the city from opening.
  }
}

