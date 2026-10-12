"use client";

import { useEffect, useMemo, useState } from "react";
import {
  allTags,
  embedUrl,
  formatTime,
  moments,
  rankMoments,
  thumbnail,
  tmdbUrl,
  tools,
} from "../lib/moments";

const SAVED_KEY = "scene-finder-saved";
const toolById = Object.fromEntries(tools.map((tool) => [tool.id, tool]));

export default function Finder({ initialId = "" }) {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [tag, setTag] = useState("");
  const [openId, setOpenId] = useState(initialId);
  const [saved, setSaved] = useState([]);
  const [trace, setTrace] = useState(null);
  const [saveNote, setSaveNote] = useState("");

  useEffect(() => {
    try {
      setSaved(JSON.parse(localStorage.getItem(SAVED_KEY) || "[]"));
    } catch {
      setSaved([]);
    }
  }, []);

  useEffect(() => {
    function onKey(event) {
      if (event.key !== "Escape") return;
      setOpenId("");
      setSaveNote("");
      const url = new URL(window.location.href);
      url.searchParams.delete("moment");
      window.history.replaceState(null, "", url);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const ranked = useMemo(() => rankMoments(submitted), [submitted]);
  const visible = ranked.filter(({ moment, score }) => {
    if (submitted && score === 0) return false;
    if (!tag) return true;
    const [kind, name] = tag.split(":");
    if (kind === "object") return moment.objects.includes(name);
    if (kind === "genre") return moment.genres.includes(name);
    return true;
  });
  const open = moments.find((moment) => moment.id === openId) || null;
  const savedIds = new Set(saved.map((item) => item.id));

  useEffect(() => {
    if (!openId) {
      setTrace(null);
      return;
    }
    const url = new URL(window.location.href);
    url.searchParams.set("moment", openId);
    window.history.replaceState(null, "", url);
    let cancelled = false;
    fetch(`/api/trace?id=${openId}`)
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled) setTrace(data.tools || null);
      })
      .catch(() => {
        if (!cancelled) setTrace(null);
      });
    return () => {
      cancelled = true;
    };
  }, [openId]);

  function closeMoment() {
    setOpenId("");
    setSaveNote("");
    const url = new URL(window.location.href);
    url.searchParams.delete("moment");
    window.history.replaceState(null, "", url);
  }

  function onSearch(event) {
    event.preventDefault();
    setSubmitted(query.trim());
    closeMoment();
  }

  async function onSave(moment) {
    const record = trace?.firebase?.record || {
      titleId: moment.tmdbId,
      startSec: moment.startSec,
      query: moment.query,
      sentence: moment.sentence,
      objects: moment.objects,
      trailerKey: moment.youtubeKey,
    };
    const response = await fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ record }),
    });
    const data = await response.json();
    if (!response.ok) {
      setSaveNote(data.error || "Could not save this moment.");
      return;
    }
    const next = [
      { id: moment.id, ...data.record },
      ...saved.filter((item) => item.id !== moment.id),
    ];
    setSaved(next);
    localStorage.setItem(SAVED_KEY, JSON.stringify(next));
    setSaveNote("Saved in this browser, in the Firebase moment shape.");
  }

  return (
    <main className={open ? "page is-open" : "page"}>
      {open ? (
        <Moment
          moment={open}
          trace={trace}
          saved={savedIds.has(open.id)}
          saveNote={saveNote}
          onBack={closeMoment}
          onSave={() => onSave(open)}
        />
      ) : (
        <>
          <p className="kicker">SCENE FINDER</p>
          <h1>Moments in the trailer</h1>
          <p className="lede">
            A quiet grid of seconds. Click a card and that window is the only thing on the page.
          </p>
          <ul className="tool-rail">
            {tools.map((tool) => (
              <li key={tool.id}>
                <strong>{tool.name}</strong> <span>{tool.job}</span>
              </li>
            ))}
          </ul>

          <form className="search-row" onSubmit={onSearch}>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="find the dogs on the island"
              aria-label="Ask for a moment"
            />
            <button type="submit">Find</button>
          </form>
          <div className="tags" aria-label="Filter by tag">
            <button className="tag" data-on={tag === "" ? "true" : "false"} type="button" onClick={() => setTag("")}>
              All
            </button>
            {allTags().map(({ name, kind }) => {
              const id = `${kind}:${name}`;
              return (
                <button
                  key={id}
                  className="tag"
                  type="button"
                  data-kind={kind}
                  data-on={tag === id ? "true" : "false"}
                  onClick={() => setTag(id)}
                >
                  {name}
                </button>
              );
            })}
          </div>
          {visible.length === 0 ? (
            <p className="empty">Nothing in these trailers matches that.</p>
          ) : (
            <section className="grid">
              {visible.map(({ moment }) => (
                <button key={moment.id} className="card" type="button" onClick={() => setOpenId(moment.id)}>
                  <img src={thumbnail(moment.youtubeKey)} alt="" />
                  <h2>{moment.title}</h2>
                  <p className="meta">
                    {moment.year} · {formatTime(moment.startSec)}–{formatTime(moment.endSec)}
                    {savedIds.has(moment.id) ? " · Saved" : ""}
                  </p>
                  <p className="blurb">{moment.sentence}</p>
                  <div className="tags">
                    {moment.objects.map((name) => (
                      <span className="tag static" data-kind="object" key={name}>
                        {name}
                      </span>
                    ))}
                    {moment.genres.map((name) => (
                      <span className="tag static" data-kind="genre" key={name}>
                        {name}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </section>
          )}
          <footer className="foot">
            Each card is one indexed trailer window. The later tools stay on that same window.
          </footer>
        </>
      )}
    </main>
  );
}

function Moment({ moment, trace, saved, saveNote, onBack, onSave }) {
  const sentence = trace?.agent?.sentence || moment.sentence;
  const title = trace?.tmdb?.title || moment.title;
  const year = trace?.tmdb?.year || moment.year;
  const objects = trace?.yolo?.objects || moment.objects;
  const chain = [
    { id: "tmdb", value: `${title} (${year})`, detail: trace?.tmdb?.source === "live" ? "Live catalog" : "Catalog title" },
    { id: "clip", value: `${formatTime(moment.startSec)}–${formatTime(moment.endSec)}`, detail: moment.clipPhrase },
    { id: "yolo", value: objects.join(", "), detail: "Objects in this window" },
    { id: "agent", value: trace?.agent?.source === "wandb" ? "Live sentence" : "Indexed sentence", detail: sentence },
    { id: "weave", value: trace?.weave?.recorded ? "Traced" : "Trace ready", detail: "Question, second, objects, sentence" },
    { id: "youtube", value: `start=${moment.startSec}`, detail: "Official trailer" },
    { id: "firebase", value: saved ? "Saved" : "Ready to save", detail: "Title, second, question, sentence" },
    { id: "cosmos", value: `${formatTime(moment.startSec)}–${formatTime(moment.endSec)}`, detail: "Same short window, later" },
    { id: "vast", value: "This window", detail: "Media layer, later" },
    { id: "coreweave", value: "This window", detail: "GPUs, later" },
  ];

  return (
    <article className="moment">
      <button className="text-button back" type="button" onClick={onBack}>
        Back to the grid
      </button>
      <p className="kicker">THIS SECOND</p>
      <h2>{sentence}</h2>
      <p className="when">
        {formatTime(moment.startSec)}–{formatTime(moment.endSec)} ·{" "}
        <a href={tmdbUrl(moment.tmdbId)} target="_blank" rel="noreferrer">
          {title} ({year})
        </a>
      </p>
      <div className="tags">
        {objects.map((name) => (
          <span className="tag static" data-kind="object" key={name}>
            {name}
          </span>
        ))}
        {moment.genres.map((name) => (
          <span className="tag static" data-kind="genre" key={name}>
            {name}
          </span>
        ))}
        <span className="tag static" data-kind="query">
          {moment.query}
        </span>
      </div>
      <ul className="tools">
        {chain.map((step) => {
          const tool = toolById[step.id];
          return (
            <li key={step.id} data-tag={tool.tag}>
              <span className="role">{tool.tag}</span>
              <small>{tool.name}</small>
              <strong>{step.value}</strong>
              <em>{step.detail}</em>
            </li>
          );
        })}
      </ul>
      <iframe
        className="player"
        src={embedUrl(moment.youtubeKey, moment.startSec)}
        title={`${title} trailer at ${formatTime(moment.startSec)}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
      <div className="actions">
        <button className="save" type="button" data-on={saved ? "true" : "false"} onClick={onSave}>
          {saved ? "Saved" : "Save this moment"}
        </button>
        {saveNote ? <p className="note">{saveNote}</p> : null}
      </div>
    </article>
  );
}
