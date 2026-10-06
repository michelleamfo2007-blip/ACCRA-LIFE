/** Game spot id → magazine place slug (or null when there is no real listing). */
export const SPOT_GUIDE: Record<string, string | null> = {
  buka: "buka",
  "polo-club": "polo-club",
  kempinski: "kempinski",
  nubuke: "nubuke",
  "gallery-1957": "gallery-1957",
  "artists-alliance": "artists-alliance",
  republic: "republic-bar-grill",
  plus233: "plus-233",
  beach: "labadi-beach",
  makola: "makola-market",
  mall: "accra-mall",
  skybar25: "skybar-25",
  bloom: "bloom-bar",
  bojo: "bojo-beach",
  kokrobite: "kokrobite-beach",
  botanical: "legon-botanical",
  hub: "impact-hub",
  hotel: "labadi-beach-hotel",
  independence: "black-star-square",
  "jamestown-coffee": "jamestown-cafe",
  teshie: "teshie-landing",
  nungua: "nungua-beach",
  monsoon: null,
};

export function guideHref(spotId: string) {
  const slug = SPOT_GUIDE[spotId];
  return slug ? `/places/${slug}` : null;
}
