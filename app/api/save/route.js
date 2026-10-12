export async function POST(request) {
  const body = await request.json().catch(() => null);
  const record = body?.record;
  if (!record || typeof record.titleId !== "number" || typeof record.startSec !== "number") {
    return Response.json({ error: "A moment record needs a title id and a start second." }, { status: 400 });
  }
  if (typeof record.query !== "string" || typeof record.sentence !== "string") {
    return Response.json({ error: "A moment record needs the question and the sentence." }, { status: 400 });
  }

  const saved = {
    titleId: record.titleId,
    startSec: record.startSec,
    query: record.query,
    sentence: record.sentence,
    objects: Array.isArray(record.objects) ? record.objects : [],
    trailerKey: record.trailerKey || "",
  };

  return Response.json({
    ok: true,
    store: "browser",
    record: saved,
  });
}
