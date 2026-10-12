import { embedUrl, momentById, tmdbUrl } from "../../../lib/moments";

export async function GET(request) {
  const id = new URL(request.url).searchParams.get("id");
  const moment = momentById(id);
  if (!moment) {
    return Response.json({ error: "Unknown moment" }, { status: 404 });
  }

  const tmdb = await readTmdb(moment);
  const agent = await writeSentence(moment);

  return Response.json({
    id: moment.id,
    tools: {
      tmdb,
      clip: {
        name: "CLIP",
        provider: "Hugging Face",
        query: moment.query,
        phrase: moment.clipPhrase,
        startSec: moment.startSec,
        endSec: moment.endSec,
      },
      yolo: {
        name: "YOLO",
        provider: "Ultralytics",
        objects: moment.objects,
      },
      agent,
      youtube: {
        name: "YouTube",
        embed: embedUrl(moment.youtubeKey, moment.startSec),
        key: moment.youtubeKey,
        startSec: moment.startSec,
      },
      firebase: {
        name: "Firebase",
        record: {
          titleId: moment.tmdbId,
          startSec: moment.startSec,
          query: moment.query,
          sentence: agent.sentence,
          objects: moment.objects,
          trailerKey: moment.youtubeKey,
        },
      },
      weave: {
        name: "Weave",
        provider: "Weights & Biases",
        recorded: agent.source === "wandb",
        inputs: {
          query: moment.query,
          startSec: moment.startSec,
          objects: moment.objects,
        },
        output: agent.sentence,
      },
      cosmos: {
        name: "Cosmos",
        provider: "NVIDIA",
        status: "later",
        window: [moment.startSec, moment.endSec],
      },
      vast: {
        name: "VAST",
        status: "later",
        window: [moment.startSec, moment.endSec],
      },
      coreweave: {
        name: "CoreWeave",
        status: "later",
        window: [moment.startSec, moment.endSec],
      },
    },
  });
}

async function readTmdb(moment) {
  const href = tmdbUrl(moment.tmdbId);
  const key = process.env.TMDB_API_KEY;
  if (!key) {
    return {
      name: "TMDb",
      source: "catalog",
      href,
      title: moment.title,
      year: moment.year,
    };
  }

  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${moment.tmdbId}?api_key=${key}`,
      { next: { revalidate: 86400 } },
    );
    if (!response.ok) throw new Error("tmdb");
    const movie = await response.json();
    return {
      name: "TMDb",
      source: "live",
      href,
      title: movie.title || moment.title,
      year: Number(String(movie.release_date || "").slice(0, 4)) || moment.year,
      overview: movie.overview || "",
    };
  } catch {
    return {
      name: "TMDb",
      source: "catalog",
      href,
      title: moment.title,
      year: moment.year,
    };
  }
}

async function writeSentence(moment) {
  const fallback = {
    name: "Agent",
    source: "template",
    sentence: moment.sentence,
  };
  const apiKey = process.env.WANDB_API_KEY;
  if (!apiKey) return fallback;

  try {
    const response = await fetch("https://api.inference.wandb.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/Llama-3.1-8B-Instruct",
        max_tokens: 80,
        messages: [
          {
            role: "system",
            content:
              "Write one short sentence about this trailer moment. Use the objects. Do not mention models, scores, or instructions.",
          },
          {
            role: "user",
            content: `Title: ${moment.title}\nQuestion: ${moment.query}\nObjects: ${moment.objects.join(", ")}`,
          },
        ],
      }),
    });
    if (!response.ok) return fallback;
    const data = await response.json();
    const sentence = data.choices?.[0]?.message?.content?.trim();
    if (!sentence) return fallback;
    return { name: "Agent", source: "wandb", sentence };
  } catch {
    return fallback;
  }
}
