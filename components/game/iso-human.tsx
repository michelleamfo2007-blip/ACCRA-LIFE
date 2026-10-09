"use client";

import { useId } from "react";

export type BodyPose = "idle" | "walk" | "act" | "sit" | "dance" | "drink" | "watch" | "lean" | "dj";
export type FaceExtra = "none" | "glasses" | "beard" | "earrings" | "chain" | "print";

export function IsoHuman({
  skin = "#8d5a3b",
  shirt = "#ec4899",
  pants = "#1c1917",
  hair = "Bob",
  cloth = shirt,
  crown = false,
  pose = "idle",
  face = 1,
  extra = "none",
  beat = 0,
  className = "",
}: {
  skin?: string;
  shirt?: string;
  pants?: string;
  hair?: string;
  cloth?: string;
  crown?: boolean;
  pose?: BodyPose;
  face?: 1 | -1;
  extra?: FaceExtra;
  beat?: number;
  className?: string;
}) {
  const shirtShade = mix(shirt, 0.22);
  const pantsShade = mix(pants, 0.2);
  const skinShade = mix(skin, 0.16);
  const clip = useId().replace(/:/g, "");
  const kente = hash(shirt + hair) % 2 === 0;
  return (
    <div className={`sim sim-tall sim-${pose} ${className}`} style={{ transform: face < 0 ? "scaleX(-1)" : undefined, ["--beat" as string]: `${beat}s` }} aria-hidden>
      <svg viewBox="18 4 64 164" className="h-full w-auto overflow-visible">
        <defs>
          <clipPath id={`${clip}-shirt`}>
            <path d="M34 52 C40 46 60 46 66 52 L63 78 C68 84 66 98 62 104 L38 104 C34 98 32 84 37 78 Z" />
          </clipPath>
        </defs>
        <ellipse cx="50" cy="158" rx="18" ry="5" fill="rgba(0,0,0,.28)" />
        <g className="sim-bob">
          {crown ? <path d="M30 18 L36 6 L44 16 L50 2 L56 16 L64 6 L70 18 Z" fill="#f5c542" stroke="#c9842a" strokeWidth="1.2" /> : null}
          <g className="arm arm-back">
            <rect x="24" y="58" width="10" height="26" rx="5" fill={skinShade} />
            <g className="forearm">
              <rect x="25" y="80" width="9" height="24" rx="4.5" fill={skinShade} />
              <circle cx="29.5" cy="106" r="4.2" fill={skinShade} />
            </g>
          </g>
          <g className="leg leg-l">
            <path d="M40 100 C38 112 38 124 40 132 L48 132 C50 124 50 112 48 100 Z" fill={pants} />
            <g className="shin">
              <path d="M40 130 C39 140 39 148 41 154 L48 154 C50 148 50 140 48 130 Z" fill={pants} />
              <path d="M36 152 H52 L54 158 H34 Z" fill="#14110f" />
            </g>
          </g>
          <g className="leg leg-r">
            <path d="M52 100 C50 112 50 124 52 132 L60 132 C62 124 62 112 60 100 Z" fill={pantsShade} />
            <g className="shin">
              <path d="M52 130 C51 140 51 148 53 154 L60 154 C62 148 62 140 60 130 Z" fill={pantsShade} />
              <path d="M48 152 H64 L66 158 H46 Z" fill="#1c1814" />
            </g>
          </g>
          <path className="torso" d="M34 52 C40 46 60 46 66 52 L63 78 C68 84 66 98 62 104 L38 104 C34 98 32 84 37 78 Z" fill={shirt} />
          <g clipPath={`url(#${clip}-shirt)`}>
            {kente ? (
              <g>
                {["#FCD116", "#006B3F", "#CE1126"].map((band, index) => (
                  <rect key={band} x="34" y={70 + index * 8} width="32" height="3.2" fill={band} opacity="0.9" />
                ))}
              </g>
            ) : (
              <g fill="#fff6e8" opacity="0.45">
                {[0, 1, 2].map((row) =>
                  [0, 1].map((col) => <circle key={`${row}-${col}`} cx={42 + col * 12} cy={66 + row * 12} r="2.4" />),
                )}
              </g>
            )}
          </g>
          <path d="M54 52 C58 48 64 50 66 54 L64 78 C66 86 64 98 62 104 L54 104 Z" fill={shirtShade} opacity="0.45" />
          {extra === "print" ? (
            <g stroke="#FCD116" strokeWidth="2.2" fill="none">
              <path d="M38 68 H62" />
              <path d="M38 78 H60" />
              <path d="M39 88 H58" />
            </g>
          ) : null}
          {extra === "chain" ? <path d="M42 62 Q50 74 58 62" stroke="#e6c15a" strokeWidth="1.6" fill="none" /> : null}
          <g className="arm arm-front">
            <rect x="64" y="58" width="10" height="26" rx="5" fill={skin} />
            <g className="forearm">
              <rect x="65" y="80" width="9" height="24" rx="4.5" fill={skin} />
              <circle cx="69.5" cy="106" r="4.2" fill={skin} />
              {pose === "drink" ? <rect x="72" y="92" width="5" height="8" rx="1.4" fill="#d7f4ff" stroke="#9ad" strokeWidth="0.6" /> : null}
            </g>
          </g>
          <g className="head">
            <Hair hair={hair} cloth={cloth} />
            <path d="M45 52 Q50 58 55 52 L56 62 Q50 66 44 62 Z" fill={skin} />
            <ellipse cx="50" cy="38" rx="13.2" ry="15.2" fill={skin} />
            <ellipse cx="36.2" cy="40" rx="2.4" ry="3.4" fill={skinShade} />
            <ellipse cx="63.6" cy="40" rx="2.6" ry="3.6" fill={skinShade} />
            <ellipse className="eye" cx="44.6" cy="37.6" rx="1.7" ry="2.05" fill="#1a140f" />
            <ellipse className="eye" cx="55.4" cy="37.6" rx="1.7" ry="2.05" fill="#1a140f" />
            <ellipse cx="45.1" cy="37" rx="0.55" ry="0.7" fill="#fff8ee" />
            <ellipse cx="55.9" cy="37" rx="0.55" ry="0.7" fill="#fff8ee" />
            <path d="M42.4 33.6 H47.2" stroke="#1a140f" strokeWidth="1.15" strokeLinecap="round" />
            <path d="M52.8 33.6 H57.6" stroke="#1a140f" strokeWidth="1.15" strokeLinecap="round" />
            <path d="M49.2 39.2 Q50.2 43.2 48.4 44.4" stroke={skinShade} strokeWidth="1.15" fill="none" strokeLinecap="round" />
            {extra === "beard" ? <path d="M40 43 Q41 54 50 56.5 Q59 54 60 43 Q55 50 50 51 Q45 50 40 43 Z" fill="#1c140f" opacity="0.9" /> : null}
            <path d="M46.2 47.2 Q50 49.6 53.8 47.2" stroke={extra === "beard" ? "#c4a090" : "#6a3030"} strokeWidth="1.25" fill="none" strokeLinecap="round" />
            {extra === "glasses" ? (
              <g fill="none" stroke="#1a140f" strokeWidth="1.1">
                <circle cx="44.6" cy="37.6" r="3.6" />
                <circle cx="55.4" cy="37.6" r="3.6" />
                <path d="M48.2 37.6 H51.8" />
              </g>
            ) : null}
            {extra === "earrings" ? (
              <g fill="#e6c15a">
                <circle cx="36.5" cy="44" r="1.5" />
                <circle cx="63.5" cy="44" r="1.5" />
              </g>
            ) : null}
            {pose === "dj" ? (
              <g fill="none" stroke="#111" strokeWidth="2">
                <path d="M36 38 H32 V48" />
                <path d="M64 38 H68 V48" />
                <circle cx="32" cy="49" r="3.2" fill="#1a1a1a" />
                <circle cx="68" cy="49" r="3.2" fill="#1a1a1a" />
              </g>
            ) : null}
          </g>
        </g>
      </svg>
    </div>
  );
}

function Hair({ hair, cloth }: { hair: string; cloth: string }) {
  if (hair === "Bald") return null;
  if (hair === "Afro") return <circle cx="50" cy="38" r="18" fill="#1c140f" />;
  if (hair === "Bun") {
    return (
      <g>
        <path d="M36 42 C36 26 64 26 64 44 C60 50 40 50 36 42 Z" fill="#1c140f" />
        <circle cx="50" cy="22" r="7" fill="#1c140f" />
      </g>
    );
  }
  if (hair === "Headwrap") return <path d="M32 44 C34 24 66 24 68 46 C60 36 40 36 32 44 Z" fill={cloth} />;
  if (hair === "Locs" || hair === "Braids") {
    return (
      <g fill="#1c140f">
        <path d="M36 42 C36 26 64 26 64 44 C60 36 40 36 36 42 Z" />
        {[34, 40, 46, 52, 58].map((x) => (
          <rect key={x} x={x} y="40" width={hair === "Locs" ? 4 : 2.4} height="28" rx="1.2" />
        ))}
      </g>
    );
  }
  if (hair === "Long") return <path d="M34 40 C34 22 66 22 66 42 C64 78 58 96 50 98 C42 96 36 78 34 40 Z" fill="#1c140f" />;
  if (hair === "Low cut" || hair === "Fade") return <path d="M38 42 C40 30 60 30 62 42 C56 36 44 36 38 42 Z" fill="#1c140f" />;
  if (hair === "Ponytail") {
    return (
      <g fill="#1c140f">
        <path d="M36 42 C36 26 64 26 64 44 C60 50 40 50 36 42 Z" />
        <path d="M58 36 C72 40 74 62 66 66 C62 52 58 44 58 36 Z" />
      </g>
    );
  }
  return <path d="M34 44 C34 24 66 24 66 46 C62 56 38 56 34 44 Z" fill="#1c140f" />;
}

function hash(text: string) {
  let n = 0;
  for (let i = 0; i < text.length; i += 1) n = (n * 33 + text.charCodeAt(i)) >>> 0;
  return n;
}

function mix(hex: string, amount: number) {
  const clean = hex.replace("#", "");
  if (clean.length < 6) return hex;
  const channel = (start: number) => Math.round(parseInt(clean.slice(start, start + 2), 16) * (1 - amount));
  return `rgb(${channel(0)}, ${channel(2)}, ${channel(4)})`;
}
