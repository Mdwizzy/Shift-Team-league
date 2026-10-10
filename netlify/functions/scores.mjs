import { getStore } from "@netlify/blobs";
import { timingSafeEqual } from "node:crypto";

const store = getStore({ name: "shift-team-c-league", consistency: "strong" });
const dataKey = "league-state-v2";
const legacyKey = "current-scores";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function validEditorKey(provided) {
  const expected = process.env.LEAGUE_EDIT_KEY;
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function validState(data) {
  if (!data || data.version !== 2 || !Array.isArray(data.seasons) || typeof data.activeSeasonId !== "string") return false;
  if (data.seasons.some((season) =>
    !season || typeof season.id !== "string" || typeof season.name !== "string" ||
    !Array.isArray(season.teams) || season.teams.some((team) => typeof team !== "string" || !team.trim()) ||
    new Set(season.teams.map((team) => team.toLowerCase())).size !== season.teams.length ||
    !Array.isArray(season.schedule) || season.schedule.some((day) =>
      !day || !Array.isArray(day.games) || !Array.isArray(day.byes) ||
      day.games.some((game) => !game || typeof game.home !== "string" || typeof game.away !== "string" || typeof game.key !== "string")
    ) ||
    !season.scores || typeof season.scores !== "object" || Array.isArray(season.scores)
  )) return false;
  for (const season of data.seasons) {
    for (const [fixture, result] of Object.entries(season.scores)) {
      if (!/^[A-Za-z0-9_-]+(?:\|[A-Za-z0-9_-]+)?$/.test(fixture) || !result || typeof result !== "object") return false;
      for (const side of ["home", "away"]) {
        const value = result[side];
        if (typeof value !== "string" || (value !== "" && !/^\d{1,2}$/.test(value))) return false;
      }
      if (result.winner !== undefined && result.winner !== "" && !season.teams.includes(result.winner)) return false;
    }
  }
  return data.seasons.some((season) => season.id === data.activeSeasonId);
}

export default async (request) => {
  if (request.method === "GET") {
    const state = await store.get(dataKey, { type: "json" });
    const legacyScores = await store.get(legacyKey, { type: "json" });
    if (state) return json({ ...state, recoveryLegacyScores: legacyScores ?? null });
    return json({ version: 2, legacyScores: legacyScores ?? null });
  }

  if (request.method !== "PUT") return json({ error: "Method not allowed" }, 405);
  if (!process.env.LEAGUE_EDIT_KEY) return json({ error: "Editor key is not configured" }, 503);
  if (!validEditorKey(request.headers.get("x-league-key"))) return json({ error: "Invalid editor key" }, 401);

  let data;
  try {
    data = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  if (!validState(data)) return json({ error: "Invalid league data" }, 400);

  await store.set(dataKey, JSON.stringify(data), { contentType: "application/json" });
  return json({ saved: true });
};
