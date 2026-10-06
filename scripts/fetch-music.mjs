import { mkdir, writeFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

const root = new URL("../public/music/", import.meta.url);
await mkdir(root, { recursive: true });

async function scrape(url) {
  const page = await fetch(url);
  const html = await page.text();
  const urls = [...html.matchAll(/https:\/\/assets\.mixkit\.co\/music\/(\d+)\/\1\.mp3/g)].map((m) => m[0]);
  return [...new Set(urls)];
}

async function download(url, name) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  const dest = new URL(name, root);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
  console.log("saved", name, res.headers.get("content-length"));
}

// African + a few dance / chill tags for club vs restaurant playlists
const pages = [
  "https://mixkit.co/free-stock-music/tag/african/",
  "https://mixkit.co/free-stock-music/tag/dance/",
  "https://mixkit.co/free-stock-music/tag/funk/",
  "https://mixkit.co/free-stock-music/tag/jazz/",
  "https://mixkit.co/free-stock-music/tag/hip-hop/",
];

const all = new Set();
for (const page of pages) {
  const found = await scrape(page);
  console.log(page, found.length);
  found.forEach((u) => all.add(u));
}

const list = [...all];
console.log("total unique", list.length);
for (const url of list) console.log(url);

// Known Mixkit African tracks from tag page + extras that work as vibe beds
const picks = {
  // Club-energy / dance (amapiano-adjacent beds until licensed Amapiano arrives)
  "club-01.mp3": "https://assets.mixkit.co/music/822/822.mp3",
  "club-02.mp3": "https://assets.mixkit.co/music/1084/1084.mp3",
  "club-03.mp3": "https://assets.mixkit.co/music/218/218.mp3",
};

// Pull a few more dance/funk IDs if scrape found them
const danceish = list.filter((u) => !Object.values(picks).includes(u)).slice(0, 6);
let i = 4;
for (const url of danceish) {
  picks[`club-0${i}.mp3`] = url;
  i += 1;
  if (i > 6) break;
}

// Restaurant calm lively — reuse softer African + jazz picks
const soft = list.filter((u) => !Object.values(picks).includes(u)).slice(0, 4);
let j = 1;
for (const url of soft.length ? soft : list.slice(0, 3)) {
  picks[`eatery-0${j}.mp3`] = url;
  j += 1;
  if (j > 4) break;
}

// Ensure eatery has at least the African tracks if soft empty
if (!picks["eatery-01.mp3"]) {
  picks["eatery-01.mp3"] = "https://assets.mixkit.co/music/822/822.mp3";
  picks["eatery-02.mp3"] = "https://assets.mixkit.co/music/218/218.mp3";
}

for (const [name, url] of Object.entries(picks)) {
  await download(url, name);
}

await writeFile(
  new URL("credits.json", root),
  JSON.stringify(
    {
      source: "Mixkit Free Stock Music",
      license: "https://mixkit.co/license/#musicFree",
      note: "Royalty-free beds for Accra Life venues. Swap in licensed Amapiano masters when available.",
      files: picks,
    },
    null,
    2,
  ),
);
console.log("done");
