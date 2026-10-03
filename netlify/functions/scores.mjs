import { getStore } from "@netlify/blobs";
import { timingSafeEqual } from "node:crypto";

const store = getStore({ name: "shift-team-c-league", consistency: "strong" });
const scoreKey = "current-scores";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

function validEditorKey(provided) {
  const expected = process.env.LEAGUE_EDIT_KEY;
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export default async (request) => {
  if (request.method === "GET") {
    const scores = await store.get(scoreKey, { type: "json" });
    return json(scores ?? {});
  }

  if (request.method !== "PUT") return json({ error: "Method not allowed" }, 405);
  if (!process.env.LEAGUE_EDIT_KEY) return json({ error: "Editor key is not configured" }, 503);
  if (!validEditorKey(request.headers.get("x-league-key")))
    return json({ error: "Invalid editor key" }, 401);

  let scores;
  try {
    scores = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  if (!scores || typeof scores !== "object" || Array.isArray(scores))
    return json({ error: "Invalid scores" }, 400);

  for (const [fixture, result] of Object.entries(scores)) {
    if (!/^[A-Za-z]+\|[A-Za-z]+$/.test(fixture) || !result || typeof result !== "object")
      return json({ error: "Invalid fixture" }, 400);
    for (const side of ["home", "away"]) {
      const value = result[side];
      if (typeof value !== "string" || (value !== "" && !/^\d{1,2}$/.test(value)))
        return json({ error: "Invalid score" }, 400);
    }
  }

  await store.set(scoreKey, JSON.stringify(scores), { contentType: "application/json" });
  return json({ saved: true });
};
