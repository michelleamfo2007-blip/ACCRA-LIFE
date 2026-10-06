import "server-only";
import { randomBytes } from "crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import { seedEvents } from "@/lib/data/events";
import { seedPlaces } from "@/lib/data/places";
import { hashPassword } from "@/lib/server/password";
import type { MediaAsset, Place, Report, Reservation, Review, Save, StoredEvent, Submission } from "@/lib/types";

export type StoredUser = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: "user" | "admin";
  createdAt: string;
};

export type Store = {
  version: number;
  users: StoredUser[];
  saves: Save[];
  reviews: Review[];
  submissions: Submission[];
  reports: Report[];
  reservations: Reservation[];
  featured: string[];
  claimed: string[];
  customPlaces: Place[];
  customEvents: StoredEvent[];
  library: MediaAsset[];
  views: Record<string, number>;
  searches: Record<string, number>;
};

const file = path.join(process.cwd(), "data", "store.json");
let cache: Store | null = null;
let queue: Promise<unknown> = Promise.resolve();

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function seed(): Store {
  const views: Record<string, number> = {};
  for (const place of seedPlaces) views[`place:${place.slug}`] = place.views;
  for (const event of seedEvents) views[`event:${event.slug}`] = event.views;
  views["category:food-dining"] = 980;
  views["category:nightlife"] = 860;
  views["category:beaches-outdoors"] = 740;
  views["category:events"] = 690;
  views["category:date-ideas"] = 610;
  views["area:osu"] = 1200;
  views["area:labadi"] = 870;
  views["area:east-legon"] = 640;

  return {
    version: 1,
    users: [
      {
        id: "usr_admin",
        name: "AccraLife Admin",
        email: "admin@accralife.app",
        passwordHash: hashPassword("AccraLife!26"),
        role: "admin",
        createdAt: daysAgo(40),
      },
      {
        id: "usr_ama",
        name: "Ama Mensah",
        email: "ama@accralife.app",
        passwordHash: hashPassword("AccraLife!26"),
        role: "user",
        createdAt: daysAgo(18),
      },
    ],
    saves: [
      { id: "sav_1", userId: "usr_ama", kind: "place", slug: "buka", createdAt: daysAgo(4) },
      { id: "sav_2", userId: "usr_ama", kind: "place", slug: "skybar-25", createdAt: daysAgo(3) },
      { id: "sav_3", userId: "usr_ama", kind: "event", slug: "afrobeats-night", createdAt: daysAgo(1) },
    ],
    reviews: [
      {
        id: "rev_1",
        placeSlug: "buka",
        userId: "usr_ama",
        userName: "Ama Mensah",
        rating: 5,
        body: "Came for the grilled tilapia and stayed because the jollof was the one I have been comparing everyone else to. Friday night needs a booking, or at least patience.",
        createdAt: daysAgo(6),
        status: "published",
      },
      {
        id: "rev_2",
        placeSlug: "skybar-25",
        userId: "usr_kwame",
        userName: "Kwame Boateng",
        rating: 4,
        body: "The view does what the posters promise. Go for sunset if you want a conversation. After ten it becomes a proper night out, which is either the point or the problem.",
        createdAt: daysAgo(9),
        status: "published",
      },
      {
        id: "rev_3",
        placeSlug: "santoku",
        userId: "usr_efua",
        userName: "Efua Darko",
        rating: 5,
        body: "Booked this for an anniversary and it was the right call. Quiet enough to talk, and the sushi was careful in a city that sometimes rushes pretty food.",
        createdAt: daysAgo(12),
        status: "published",
      },
      {
        id: "rev_4",
        placeSlug: "kokrobite-beach",
        userId: "usr_nana",
        userName: "Nana Yaa Owusu",
        rating: 5,
        body: "Sunday still works. We left Osu at noon, swam, listened to the drums, and accepted the traffic home like adults. Weekdays are even better if you can steal one.",
        createdAt: daysAgo(3),
        status: "published",
      },
      {
        id: "rev_5",
        placeSlug: "labone-social",
        userId: "usr_kojo",
        userName: "Kojo Ampah",
        rating: 4,
        body: "Wifi held through a two-hour call, which is the review that matters. The lunch bowl was good. The morning croissant was better. Tables go fast after nine.",
        createdAt: daysAgo(2),
        status: "published",
      },
      {
        id: "rev_6",
        placeSlug: "auntie-akos",
        userId: "usr_abena",
        userName: "Abena Sarpong",
        rating: 5,
        body: "Red red, a short queue, and a bill that did not require a discussion. This is the Adabraka lunch I send people to when they ask for real food.",
        createdAt: daysAgo(8),
        status: "published",
      },
      {
        id: "rev_7",
        placeSlug: "polo-club",
        userId: "usr_selorm",
        userName: "Selorm Agbeko",
        rating: 4,
        body: "Sunday lunch is still the move. Service slowed once the garden filled, but nobody at our table was in a hurry except the person who had parked badly.",
        createdAt: daysAgo(15),
        status: "published",
      },
      {
        id: "rev_8",
        placeSlug: "gallery-1957",
        userId: "usr_malik",
        userName: "Malik Ibrahim",
        rating: 5,
        body: "Walked in not knowing the show and left with a list of artists. Free, calm, and a much better date than I expected from a Tuesday.",
        createdAt: daysAgo(5),
        status: "published",
      },
      {
        id: "rev_9",
        placeSlug: "republic-bar-grill",
        userId: "usr_ama",
        userName: "Ama Mensah",
        rating: 3,
        body: "Fine for a casual burger and a match. The terrace is the reason to come. I would not plan a quiet dinner here, and I do not think they want me to.",
        createdAt: daysAgo(1),
        status: "pending",
      },
    ],
    submissions: [
      {
        id: "sub_1",
        type: "place",
        status: "pending",
        createdAt: daysAgo(1),
        submittedBy: "usr_ama",
        payload: {
          name: "Adabraka Book Nook",
          category: "cafes",
          area: "adabraka",
          address: "Farrar Avenue, Adabraka",
          description:
            "A small reading room and coffee counter above a stationery shop. Good for an hour with a book, less good for a loud call.",
          phone: "+233 20 555 0191",
          instagram: "adabrakabooknook",
          priceRange: 1,
        },
      },
      {
        id: "sub_2",
        type: "event",
        status: "pending",
        createdAt: daysAgo(2),
        submittedBy: null,
        payload: {
          name: "Rooftop Cinema",
          category: "Culture",
          date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          startTime: "19:00",
          endTime: "22:00",
          area: "labone",
          venue: "Labone Social roof",
          price: 50,
          description: "A one-night outdoor screening of a Ghanaian classic, blankets encouraged, drizzle plan included.",
        },
      },
    ],
    reports: [
      {
        id: "rpt_1",
        reviewId: "rev_2",
        userId: "usr_ama",
        reason: "This reads like an ad for a competing rooftop. Please check it.",
        createdAt: daysAgo(1),
        status: "open",
      },
    ],
    reservations: [],
    featured: seedPlaces.filter((place) => place.featured).map((place) => place.slug),
    claimed: ["buka", "kempinski", "labadi-beach-hotel"],
    customPlaces: [],
    customEvents: [],
    library: [],
    views,
    searches: {
      "date night": 126,
      osu: 118,
      beach: 104,
      brunch: 77,
      cafes: 69,
      nightlife: 91,
      jollof: 58,
      kokrobite: 63,
    },
  };
}

function ensure() {
  if (cache) return cache;
  if (!existsSync(file)) {
    mkdirSync(path.dirname(file), { recursive: true });
    const initial = seed();
    writeFileSync(file, JSON.stringify(initial, null, 2));
    cache = initial;
    return cache;
  }
  cache = JSON.parse(readFileSync(file, "utf8")) as Store;
  if (!Array.isArray(cache.library)) cache.library = [];
  return cache;
}

export function readStore() {
  return ensure();
}

export function updateStore<T>(mutate: (store: Store) => T): Promise<T> {
  const run = queue.then(() => {
    const store = ensure();
    const result = mutate(store);
    writeFileSync(file, JSON.stringify(store, null, 2));
    cache = store;
    return result;
  });
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function uid(prefix: string) {
  return `${prefix}_${randomBytes(5).toString("hex")}`;
}

export function toPublicUser(user: StoredUser) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}
