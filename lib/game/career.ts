import { cedis, cloneLife, logLine, passTime, spotById, type Life, type Music, type Skills, type Song, type StepResult } from "@/lib/game/world";

export const STUDIO_FEE = 150;
const RECORD_GAP = 360;
const GIG_GAP = 240;
const PER_CEDI = 20;

export const TIERS: [number, string][] = [
  [25000, "Headliner"],
  [6000, "Star"],
  [1500, "Known"],
  [300, "Buzzing"],
  [0, "Upcoming"],
];

const id = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

function musicOf(life: Life): Music {
  return life.music ?? { songs: [], fans: 0 };
}

export function tierOf(fans: number) {
  return TIERS.find(([floor]) => fans >= floor)?.[1] ?? "Upcoming";
}

export function streamsOf(song: Song, minutes: number, fans: number) {
  const hours = Math.max(0, (minutes - song.at) / 60);
  const reach = song.quality * 60 * (1 + Math.sqrt(fans) / 20);
  return Math.round(reach * (1 - Math.exp(-hours / 36)));
}

export function royaltiesDue(life: Life) {
  const music = musicOf(life);
  return music.songs.reduce((sum, song) => sum + Math.floor(Math.max(0, streamsOf(song, life.minutes, music.fans) - song.paid) / PER_CEDI), 0);
}

export function recordWait(life: Life) {
  return Math.max(0, (musicOf(life).lastRecord ?? -1e9) + RECORD_GAP - life.minutes);
}

export function gigWait(life: Life) {
  return Math.max(0, (musicOf(life).lastGig ?? -1e9) + GIG_GAP - life.minutes);
}

export function recordSong(life: Life, title: string): StepResult {
  const name = title.trim().replace(/\s+/g, " ").slice(0, 40);
  if (!name) return { life, notes: [], error: "Give the song a title." };
  const wait = recordWait(life);
  if (wait > 0) return { life, notes: [], error: `The studio is booked. Back in ${Math.ceil(wait / 60)}h.` };
  if (life.cash < STUDIO_FEE) return { life, notes: [], error: `Studio time costs ${cedis(STUDIO_FEE)}.` };
  const timed = passTime(cloneLife(life), 120).life;
  const music = musicOf(timed);
  const quality = Math.min(100, Math.round(20 + timed.skills.music * 7 + Math.random() * 20));
  const song: Song = { id: id(), title: name, at: timed.minutes, quality, paid: 0 };
  timed.cash -= STUDIO_FEE;
  timed.music = { ...music, songs: [song, ...music.songs].slice(0, 30), fans: music.fans + Math.round(quality / 4), lastRecord: timed.minutes };
  timed.skills.music = Math.min(10, timed.skills.music + (Math.random() < 0.5 ? 1 : 0));
  timed.needs.energy = Math.max(0, timed.needs.energy - 10);
  timed.needs.fun = Math.min(100, timed.needs.fun + 12);
  const line = `"${name}" is out. The engineer rated it ${quality}/100.`;
  logLine(timed, line);
  return { life: timed, notes: [line] };
}

export function collectRoyalties(life: Life): StepResult {
  const due = royaltiesDue(life);
  if (due < 1) return { life, notes: [], error: "Streams are still counting. Check back later." };
  const next = cloneLife(life);
  const music = musicOf(next);
  next.music = { ...music, songs: music.songs.map((song) => ({ ...song, paid: song.paid + Math.floor(Math.max(0, streamsOf(song, next.minutes, music.fans) - song.paid) / PER_CEDI) * PER_CEDI })) };
  next.cash += due;
  return { life: next, notes: [`Streaming royalties: ${cedis(due)}.`] };
}

export function playGig(life: Life): StepResult {
  if (life.where === "home") return { life, notes: [], error: "Go to a bar, club or beach to perform." };
  const music = musicOf(life);
  if (!music.songs.length) return { life, notes: [], error: "Record a song first. Nobody books an artist with no music." };
  const wait = gigWait(life);
  if (wait > 0) return { life, notes: [], error: `Your voice needs rest. Back in ${Math.ceil(wait / 60)}h.` };
  const timed = passTime(cloneLife(life), 90).life;
  const pay = Math.min(1500, 20 + Math.floor(music.fans / 40));
  const gained = 10 + timed.skills.music * 5 + Math.floor(music.fans * 0.03);
  timed.cash += pay;
  timed.music = { ...musicOf(timed), fans: music.fans + gained, lastGig: timed.minutes };
  timed.needs.energy = Math.max(0, timed.needs.energy - 14);
  timed.needs.fun = Math.min(100, timed.needs.fun + 16);
  timed.needs.social = Math.min(100, timed.needs.social + 12);
  timed.stats = { ...timed.stats, gigs: (timed.stats?.gigs ?? 0) + 1 };
  const line = `You performed at ${spotById(life.where).name}. ${cedis(pay)} and ${gained} new fans.`;
  logLine(timed, line);
  return { life: timed, notes: [line] };
}

export const VIDEO_FEE = 800;
export const SHOW_GAP = 4320;

export type Venue = { id: string; label: string; capacity: number; hire: number; minFans: number };

export const VENUES: Venue[] = [
  { id: "republic", label: "Republic Bar & Grill", capacity: 150, hire: 100, minFans: 200 },
  { id: "plus233", label: "+233 Jazz Bar", capacity: 220, hire: 200, minFans: 500 },
  { id: "afrikiko", label: "Afrikiko open air", capacity: 800, hire: 600, minFans: 1500 },
  { id: "theatre", label: "National Theatre", capacity: 1500, hire: 2000, minFans: 6000 },
  { id: "stadium", label: "Accra Stadium", capacity: 12000, hire: 8000, minFans: 25000 },
];

export const TICKETS = [20, 50, 120];
export const SHOW_CUT = 0.2;

export function showWait(life: Life) {
  return Math.max(0, (musicOf(life).lastShow ?? -1e9) + SHOW_GAP - life.minutes);
}

export function venueOf(id: string) {
  return VENUES.find((venue) => venue.id === id) ?? null;
}

export function crowdFor(life: Life, venue: Venue, price: number) {
  const music = musicOf(life);
  const pull = price <= 20 ? 0.2 : price <= 50 ? 0.1 : 0.04;
  const best = music.songs.reduce((top, song) => Math.max(top, song.quality + (song.video ? 10 : 0)), 0);
  return Math.min(venue.capacity, Math.round(music.fans * pull * (0.6 + best / 200)));
}

export function holdShow(life: Life, venueId: string, price: number): StepResult {
  const venue = venueOf(venueId);
  if (!venue) return { life, notes: [], error: "Pick a venue." };
  if (!TICKETS.includes(price)) return { life, notes: [], error: "Pick a ticket price." };
  if (life.where !== venue.id) return { life, notes: [], error: `Go to ${venue.label} to put on the show.` };
  const music = musicOf(life);
  if (!music.songs.length) return { life, notes: [], error: "Record some songs first. A show needs a setlist." };
  if (music.fans < venue.minFans) return { life, notes: [], error: `${venue.label} books artists with ${venue.minFans.toLocaleString("en-GH")} fans or more.` };
  const wait = showWait(life);
  if (wait > 0) return { life, notes: [], error: `Rest the band. Next show in ${Math.ceil(wait / 60)}h.` };
  if (life.cash < venue.hire) return { life, notes: [], error: `Hiring ${venue.label} costs ${cedis(venue.hire)}.` };
  if (life.needs.energy < 25) return { life, notes: [], error: "Too tired to perform. Sleep first." };
  const timed = passTime(cloneLife(life), 180).life;
  const crowd = Math.max(0, Math.round(crowdFor(life, venue, price) * (0.8 + Math.random() * 0.3)));
  const takings = crowd * price;
  const cut = Math.round(takings * SHOW_CUT);
  const gained = Math.round(crowd * 0.25 + timed.skills.music * 10);
  timed.cash += cut - venue.hire;
  timed.music = { ...musicOf(timed), fans: music.fans + gained, lastShow: timed.minutes, shows: (music.shows ?? 0) + 1 };
  timed.skills.music = Math.min(10, timed.skills.music + (Math.random() < 0.35 ? 1 : 0));
  timed.needs.energy = Math.max(0, timed.needs.energy - 30);
  timed.needs.fun = Math.min(100, timed.needs.fun + 24);
  timed.needs.social = Math.min(100, timed.needs.social + 24);
  timed.stats = { ...timed.stats, gigs: (timed.stats?.gigs ?? 0) + 1 };
  const full = crowd >= venue.capacity ? " Sold out!" : "";
  const line = `${crowd.toLocaleString("en-GH")} people at ${venue.label}.${full} Tickets ${cedis(takings)}, your cut ${cedis(cut)} after the promoter, hire ${cedis(venue.hire)}, ${gained} new fans.`;
  logLine(timed, line);
  return { life: timed, notes: [line] };
}

export function shootVideo(life: Life, songId: string): StepResult {
  const music = musicOf(life);
  const song = music.songs.find((item) => item.id === songId);
  if (!song) return { life, notes: [], error: "That song is gone." };
  if (song.video) return { life, notes: [], error: "That song already has a video." };
  if (life.cash < VIDEO_FEE) return { life, notes: [], error: `A video shoot costs ${cedis(VIDEO_FEE)}.` };
  const timed = passTime(cloneLife(life), 240).life;
  timed.cash -= VIDEO_FEE;
  const boost = 8 + Math.floor(Math.random() * 7);
  timed.music = {
    ...musicOf(timed),
    fans: music.fans + 40 + Math.round(song.quality / 2),
    songs: music.songs.map((item) => (item.id === songId ? { ...item, video: true, quality: Math.min(100, item.quality + boost) } : item)),
  };
  timed.needs.energy = Math.max(0, timed.needs.energy - 18);
  timed.needs.fun = Math.min(100, timed.needs.fun + 14);
  const line = `The video for "${song.title}" is out. Jamestown walls, a drone shot over Osu, and the song is up to ${Math.min(100, song.quality + boost)}/100.`;
  logLine(timed, line);
  return { life: timed, notes: [line] };
}

export type ChartSong = { title: string; artist: string; username: string; streams: number; quality: number; video: boolean };

export function chartWindow(week: number) {
  const start = (week * 7 - 3) * 1440;
  return { start, end: start + 7 * 1440 };
}

export function streamsBetween(song: Song, fans: number, from: number, to: number) {
  return Math.max(0, streamsOf(song, to, fans) - streamsOf(song, from, fans));
}

export const CHART_PRIZES = [1000, 600, 400, 150, 150, 150, 150, 150, 150, 150];

export type Course = { id: string; label: string; fee: number; sessions: number; needs: string | null; perk: string; skill?: keyof Skills };

export const COURSES: Course[] = [
  { id: "wassce", label: "WASSCE", fee: 300, sessions: 4, needs: null, perk: "+15% pay on every job" },
  { id: "catering", label: "Catering certificate", fee: 600, sessions: 4, needs: "wassce", perk: "+2 Cooking, +10% job pay", skill: "cooking" },
  { id: "electrical", label: "Electrical installation", fee: 700, sessions: 5, needs: "wassce", perk: "+2 Hustle, +10% job pay", skill: "hustle" },
  { id: "bootcamp", label: "Coding bootcamp", fee: 1500, sessions: 5, needs: "wassce", perk: "+2 Coding, +15% job pay", skill: "coding" },
  { id: "degree", label: "University degree (Legon)", fee: 2500, sessions: 8, needs: "wassce", perk: "+30% job pay", skill: "career" },
  { id: "masters", label: "Master's degree", fee: 6000, sessions: 8, needs: "degree", perk: "+20% more job pay", skill: "career" },
];

const CLASS_GAP = 360;

export function courseOf(id?: string | null) {
  return COURSES.find((course) => course.id === id) ?? null;
}

export function classWait(life: Life) {
  return Math.max(0, (life.school?.lastClass ?? -1e9) + CLASS_GAP - life.minutes);
}

export function enrolCourse(life: Life, courseId: string): StepResult {
  const course = courseOf(courseId);
  const school = life.school ?? { certs: [] };
  if (!course) return { life, notes: [], error: "No course like that." };
  if (school.certs.includes(course.id)) return { life, notes: [], error: "You already have that certificate." };
  if (school.course) return { life, notes: [], error: "Finish your current course first." };
  if (course.needs && !school.certs.includes(course.needs)) return { life, notes: [], error: `You need ${courseOf(course.needs)?.label ?? course.needs} first.` };
  if (life.cash < course.fee) return { life, notes: [], error: `Fees are ${cedis(course.fee)}.` };
  const next = cloneLife(life);
  next.cash -= course.fee;
  next.school = { ...school, course: course.id, done: 0 };
  return { life: next, notes: [`Enrolled in ${course.label}. ${course.sessions} classes to go.`] };
}

export function attendClass(life: Life): StepResult {
  const course = courseOf(life.school?.course);
  if (!course || !life.school) return { life, notes: [], error: "Enrol in a course first." };
  const wait = classWait(life);
  if (wait > 0) return { life, notes: [], error: `Next class starts in ${Math.ceil(wait / 60)}h.` };
  if (life.needs.energy < 15) return { life, notes: [], error: "Too tired for class. Sleep first." };
  const timed = passTime(cloneLife(life), 180).life;
  const done = (life.school.done ?? 0) + 1;
  timed.needs.energy = Math.max(0, timed.needs.energy - 12);
  timed.needs.fun = Math.max(0, timed.needs.fun - 6);
  timed.needs.social = Math.min(100, timed.needs.social + 6);
  if (done >= course.sessions) {
    timed.school = { certs: [...life.school.certs, course.id], course: null, done: 0, lastClass: timed.minutes };
    if (course.skill) timed.skills[course.skill] = Math.min(10, timed.skills[course.skill] + 2);
    const line = `You passed: ${course.label}. ${course.perk}.`;
    logLine(timed, line);
    return { life: timed, notes: [line] };
  }
  timed.school = { ...life.school, done, lastClass: timed.minutes };
  return { life: timed, notes: [`Class ${done} of ${course.sessions} done.`] };
}
