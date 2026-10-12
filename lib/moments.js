export const tools = [
  { id: "tmdb", name: "TMDb", job: "Finds the trailer", tag: "Required", hands: "YouTube key" },
  { id: "clip", name: "CLIP", job: "Finds the second", tag: "Required", hands: "Start second" },
  { id: "yolo", name: "YOLO", job: "Names the objects", tag: "Optional", hands: "Object list" },
  { id: "agent", name: "Agent", job: "Writes one sentence", tag: "Online", hands: "The sentence" },
  { id: "weave", name: "Weave", job: "Records the agent", tag: "Trace", hands: "The run" },
  { id: "youtube", name: "YouTube", job: "Plays that second", tag: "Required", hands: "The clip" },
  { id: "firebase", name: "Firebase", job: "Saves the moment", tag: "Required", hands: "Saved moment" },
  { id: "cosmos", name: "Cosmos", job: "Later pass on this window", tag: "Later", hands: "A richer read" },
  { id: "vast", name: "VAST", job: "Later media layer", tag: "Later", hands: "The files" },
  { id: "coreweave", name: "CoreWeave", job: "Later GPU pass", tag: "Later", hands: "The compute" },
];

export const moments = [
  {
    id: "isle-of-dogs",
    title: "Isle of Dogs",
    year: 2018,
    tmdbId: 399174,
    youtubeKey: "dt__kig8PVU",
    startSec: 45,
    endSec: 49,
    query: "find the dogs on the island",
    clipPhrase: "a pack of dogs standing together outdoors",
    objects: ["dog"],
    genres: ["Adventure", "Animation", "Comedy"],
    sentence:
      "A pack of dogs stands together on the island, the whole reason a boy crosses the river.",
  },
  {
    id: "secret-life-of-pets",
    title: "The Secret Life of Pets",
    year: 2016,
    tmdbId: 328111,
    youtubeKey: "UZJVc_JTI_w",
    startSec: 28,
    endSec: 32,
    query: "find the dog waiting by the window",
    clipPhrase: "a dog waiting indoors by a window",
    objects: ["dog"],
    genres: ["Animation", "Family", "Comedy"],
    sentence:
      "A dog waits by the window for the person who left, already sure they are coming back.",
  },
  {
    id: "mad-max",
    title: "Mad Max: Fury Road",
    year: 2015,
    tmdbId: 76341,
    youtubeKey: "hEJnMQG9ev8",
    startSec: 62,
    endSec: 66,
    query: "find the war rig on the open road",
    clipPhrase: "a truck racing on a desert road with people on vehicles",
    objects: ["truck", "car", "person"],
    genres: ["Action", "Adventure"],
    sentence:
      "The war rig runs the open road, people braced to the machines on either side.",
  },
  {
    id: "paddington-2",
    title: "Paddington 2",
    year: 2017,
    tmdbId: 346648,
    youtubeKey: "52x5HJ9H8DM",
    startSec: 24,
    endSec: 28,
    query: "find the bear with the family",
    clipPhrase: "a small bear in a coat standing with people",
    objects: ["teddy bear", "person"],
    genres: ["Adventure", "Comedy", "Family"],
    sentence:
      "A small bear in a coat stands among the people who kept a place for him.",
  },
  {
    id: "little-miss-sunshine",
    title: "Little Miss Sunshine",
    year: 2006,
    tmdbId: 773,
    youtubeKey: "bQ7BZTMLImA",
    startSec: 40,
    endSec: 44,
    query: "find the family in the yellow van",
    clipPhrase: "a family crowded into a yellow van",
    objects: ["person", "bus"],
    genres: ["Comedy", "Drama"],
    sentence:
      "The family piles into the yellow van, already talking over one another.",
  },
  {
    id: "ford-v-ferrari",
    title: "Ford v Ferrari",
    year: 2019,
    tmdbId: 359724,
    youtubeKey: "zyYgDtY2AMY",
    startSec: 78,
    endSec: 82,
    query: "find the race car on the track",
    clipPhrase: "a person driving a race car on a track",
    objects: ["car", "person"],
    genres: ["Drama", "Action"],
    sentence:
      "A driver sits low in the race car as the track opens in front of the hood.",
  },
];

export function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function thumbnail(key) {
  return `https://i.ytimg.com/vi/${key}/hqdefault.jpg`;
}

export function embedUrl(key, startSec) {
  return `https://www.youtube-nocookie.com/embed/${key}?start=${startSec}&rel=0`;
}

export function tmdbUrl(tmdbId) {
  return `https://www.themoviedb.org/movie/${tmdbId}`;
}

export function momentById(id) {
  return moments.find((moment) => moment.id === id) || null;
}

const STOP = new Set(["find", "the", "a", "an", "on", "in", "of", "and", "with", "to"]);

export function rankMoments(query) {
  const words = query
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.replace(/[^a-z0-9]/g, ""))
    .filter((word) => word.length > 2 && !STOP.has(word));

  if (!words.length) {
    return moments.map((moment) => ({ moment, score: 0 }));
  }

  return moments
    .map((moment) => {
      const hay = [
        moment.query,
        moment.clipPhrase,
        moment.sentence,
        moment.title,
        moment.objects.join(" "),
        moment.genres.join(" "),
      ]
        .join(" ")
        .toLowerCase();
      const score = words.reduce((sum, word) => sum + (hay.includes(word) ? 1 : 0), 0);
      return { moment, score };
    })
    .sort((a, b) => b.score - a.score);
}

export function allTags() {
  const objects = new Set();
  const genres = new Set();
  for (const moment of moments) {
    for (const objectName of moment.objects) objects.add(objectName);
    for (const genre of moment.genres) genres.add(genre);
  }
  const sort = (values, kind) =>
    [...values]
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({ name, kind }));
  return [...sort(objects, "object"), ...sort(genres, "genre")];
}
