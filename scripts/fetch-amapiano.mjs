import { mkdir, writeFile, unlink } from "node:fs/promises";
import { createWriteStream, existsSync } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

const root = new URL("../public/music/", import.meta.url);
await mkdir(root, { recursive: true });

async function download(url, name) {
  const res = await fetch(url, {
    headers: { "User-Agent": "AccraLifeMusicFetcher/1.0" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  const dest = new URL(name, root);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
  console.log("saved", name, res.headers.get("content-length") ?? "?");
}

// FreeVibeVault CC BY 4.0 Amapiano — hot club energy vs calm lively restaurant beds
const club = [
  ["club-01.mp3", "Taxi Rank Circuit", "ye1s3nv1hlgkjdy9esy78o3b", "https://cdn.freevibevault.com/2026/08/ee30f40f-85c5-4bd5-9e64-c317d457d772.mp3"],
  ["club-02.mp3", "Pool Deck Transit", "u5qr593x82apg2fpw74jari1", "https://cdn.freevibevault.com/2026/08/d05c62e7-aed4-4bdf-8e3d-eeb39e2b4c77.mp3"],
  ["club-03.mp3", "Acacia Run", "w1vu4y23qnf95k8oskokwr29", "https://cdn.freevibevault.com/2026/08/37d8de91-58c0-41fa-bf26-ba08d60f480d.mp3"],
  ["club-04.mp3", "Tide Circuit", "bjixtzj9njxl7dt6f08qlpp9", "https://cdn.freevibevault.com/2026/08/e7499d58-a306-418a-b5a6-68acd7d84b8c.mp3"],
  ["club-05.mp3", "Balcony Circuit", "pz8daa0wl1fe69uqnp7gohqa", "https://cdn.freevibevault.com/2026/06/d3624426-6674-4867-9858-e94ee60fda82.mp3"],
  ["club-06.mp3", "Pierline Rendezvous", "iw1itr1xehxna2qlookbxc5n", "https://cdn.freevibevault.com/2026/08/fbf0620b-3297-44da-86c5-e8f938723dd5.mp3"],
];

const eatery = [
  ["eatery-01.mp3", "Marina Sequence", "ryiju9ix42tr0tr1svlhe7fh", "https://cdn.freevibevault.com/2026/06/61e3937b-fa23-468e-bf7b-141a93d47166.mp3"],
  ["eatery-02.mp3", "Harbor Streak", "x7456fe4g2kjbc9dq90usq0l", "https://cdn.freevibevault.com/2026/08/de076bf2-35a8-4603-a307-81435f08a883.mp3"],
  ["eatery-03.mp3", "Terrace Afterglow", "j96u60c8jg4dqlm2a0bxzm1f", "https://cdn.freevibevault.com/2026/08/d12895d9-c218-48e7-92ed-cfe4b92c6f83.mp3"],
  ["eatery-04.mp3", "Lantern After Rain", "f63dzbhyxti8wdqszyvedhpv", "https://cdn.freevibevault.com/2026/08/3699a4ab-07d4-4da3-b38a-5f886bd69556.mp3"],
  ["eatery-05.mp3", "Courtyard Mosaic", "uvj1kaqp0nvz3eousagrexp2", "https://cdn.freevibevault.com/2026/08/09ff33c7-381c-48e8-9797-39cc0bb0c1c2.mp3"],
  ["eatery-06.mp3", "Veranda Ledger", "pb9opjjxzd1av9vdyoqpn3l4", "https://cdn.freevibevault.com/2026/08/25877df3-2e4b-41c9-9b3f-f0660ab63b2a.mp3"],
];

const credits = {
  source: "FreeVibeVault",
  license: "CC BY 4.0 — https://creativecommons.org/licenses/by/4.0/",
  attribution: "Music by FreeVibeVault via FreeVibeVault (CC BY 4.0)",
  note: "Real Amapiano instrumentals: club playlist is hotter; restaurant playlist is calm and lively.",
  files: {},
};

for (const [name, title, id, url] of [...club, ...eatery]) {
  credits.files[name] = {
    title,
    url: `https://freevibevault.com/track/${id}`,
    mp3: url,
    role: name.startsWith("club") ? "club" : "eatery",
  };
  await download(url, name);
}

await writeFile(new URL("credits.json", root), `${JSON.stringify(credits, null, 2)}\n`);

for (const name of [
  "_probe.txt",
  "_page.html",
  "_mixkit.html",
  "_club-amapiano-01.mp3.html",
  "_club-amapiano-02.mp3.html",
  "_club-amapiano-03.mp3.html",
  "_dl-ye1s3nv1hlgkjdy9esy78o3b.html",
]) {
  const path = new URL(name, root);
  if (existsSync(path)) await unlink(path).catch(() => {});
}

console.log("done", Object.keys(credits.files).length, "amapiano beds");
