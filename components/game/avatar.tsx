"use client";

import { useId } from "react";
import type { Look } from "@/lib/game/world";

export function SimAvatar({
  look,
  crown = false,
  pose = "idle",
  face = 1,
  view = "front",
  className = "",
}: {
  look: Look;
  crown?: boolean;
  pose?: "idle" | "walk" | "act";
  face?: 1 | -1;
  view?: "front" | "back";
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const woman = look.body === "woman";
  const office = look.outfit === "Office";
  const white = look.outfit === "All-white";
  const site = look.outfit === "Site work";
  const top = white ? "#f4efe6" : site ? "#f59e42" : office ? "#f7f4ef" : look.cloth;
  const bottom = white ? "#f7f4ee" : site ? "#6b4a2e" : office ? "#243044" : look.accent;
  const skirt = woman && look.outfit !== "Casual" && look.outfit !== "Site work";
  const skin = look.skin;
  const skinHi = mix(skin, 0.28);
  const hair = "#1c140f";
  const pat = `${uid}-cloth`;

  if (view === "back" && woman) {
    return <TallGirl look={look} crown={crown} pose={pose} face={face} className={className} />;
  }

  return (
    <div className={`sim sim-${pose} ${className}`} style={{ transform: face < 0 ? "scaleX(-1)" : undefined }} aria-hidden>
      <svg viewBox={woman ? "20 8 160 392" : "20 8 160 348"} className="h-auto w-full overflow-visible">
        <defs>
          <radialGradient id={`${uid}-skin`} cx="38%" cy="32%" r="70%">
            <stop offset="0%" stopColor={skinHi} />
            <stop offset="100%" stopColor={skin} />
          </radialGradient>
          <pattern id={pat} width="10" height="10" patternUnits="userSpaceOnUse">
            {look.pattern === "Kente" ? (
              <>
                <rect width="10" height="10" fill={top} />
                <rect x="0" width="2" height="10" fill="#1d2433" />
                <rect x="4" width="2" height="10" fill="#c9a227" />
              </>
            ) : null}
            {look.pattern === "Ankara" ? (
              <>
                <rect width="10" height="10" fill={top} />
                <circle cx="3" cy="3" r="1.3" fill="rgba(255,255,255,.55)" />
                <circle cx="8" cy="7" r="1.3" fill="rgba(22,32,60,.35)" />
              </>
            ) : null}
            {look.pattern === "Tie-dye" ? (
              <>
                <rect width="10" height="10" fill={top} />
                <circle cx="5" cy="5" r="3" fill="rgba(255,255,255,.28)" />
              </>
            ) : null}
            {look.pattern === "Plain" ? <rect width="10" height="10" fill={top} /> : null}
          </pattern>
        </defs>
        <g className="sim-bob">
          <Hair look={look} hair={hair} layer="back" compact={woman} />
          <Arm origin={woman ? "76 128" : "64 158"} skin={skin} side="back" long={woman} />
          <Leg origin={woman ? "94 214" : "86 214"} fill={skirt ? skin : bottom} side="l" long={woman} />
          <Leg origin={woman ? "112 214" : "114 214"} fill={skirt ? skin : bottom} side="r" long={woman} />
          <g className="torso">
            <path
              d={woman ? "M80 126 Q72 166 80 214 L120 214 Q128 166 120 126 Q110 138 100 136 Q90 138 80 126 Z" : "M70 148 Q64 176 72 214 L128 214 Q136 176 130 148 Q116 160 100 158 Q84 160 70 148 Z"}
              fill={`url(#${pat})`}
            />
            {skirt ? <path d={woman ? "M84 206 L116 206 L128 292 L72 292 Z" : "M74 206 L126 206 L140 268 L60 268 Z"} fill={bottom} /> : null}
            {!skirt && !woman ? <path d="M86 168 H114 L110 188 H90 Z" fill={shade(top, 0.18)} opacity="0.45" /> : null}
          </g>
          <Arm origin={woman ? "124 128" : "136 158"} skin={skin} side="front" long={woman} />
          {woman ? <rect x="95" y="108" width="10" height="28" rx="5" fill={`url(#${uid}-skin)`} /> : <rect x="92" y="124" width="16" height="24" rx="7" fill={`url(#${uid}-skin)`} />}
          <g transform={woman ? "translate(100 78) scale(0.68) translate(-100 -86)" : undefined}>
            {crown ? <path d="M78 36 L84 18 L92 32 L100 12 L108 32 L116 18 L122 36 Z" fill="#f5c542" stroke="#c9842a" strokeWidth="1.5" /> : null}
            <circle cx="62" cy="92" r="8" fill={skin} />
            <circle cx="138" cy="92" r="8" fill={skin} />
            <circle cx="100" cy="86" r="36" fill={`url(#${uid}-skin)`} />
            <Hair look={look} hair={hair} layer="front" />
            <g className="eyes">
              <ellipse className="eye" cx="86" cy="88" rx="3.4" ry="4" fill="#1a120e" />
              <ellipse className="eye" cx="114" cy="88" rx="3.4" ry="4" fill="#1a120e" />
              <ellipse cx="85" cy="86.5" rx="1.1" ry="1.2" fill="white" />
              <ellipse cx="113" cy="86.5" rx="1.1" ry="1.2" fill="white" />
            </g>
            <path d="M96 98 Q100 102 104 98" fill="none" stroke={shade(skin, 0.25)} strokeWidth="1.4" strokeLinecap="round" />
            <path d="M90 108 Q100 116 110 108" fill="none" stroke="#7a3b42" strokeWidth="2" strokeLinecap="round" />
            <ellipse cx="78" cy="100" rx="6" ry="3" fill="#e07a7a" opacity="0.28" />
            <ellipse cx="122" cy="100" rx="6" ry="3" fill="#e07a7a" opacity="0.28" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function TallGirl({
  look,
  crown,
  pose,
  face,
  className,
}: {
  look: Look;
  crown: boolean;
  pose: "idle" | "walk" | "act";
  face: 1 | -1;
  className: string;
}) {
  const shirt = look.outfit === "All-white" ? "#f7f4ef" : look.outfit === "Site work" ? "#f59e42" : look.cloth;
  const pants = look.outfit === "All-white" ? "#f4efe6" : "#1c1917";
  const skin = look.skin;
  const hair = "#1c140f";
  return (
    <div className={`sim sim-tall sim-${pose} ${className}`} style={{ transform: face < 0 ? "scaleX(-1)" : undefined }} aria-hidden>
      <svg viewBox="32 0 96 360" className="h-full w-auto overflow-visible">
        <g className="sim-bob">
          {crown ? <path d="M52 28 L58 12 L66 26 L80 6 L94 26 L102 12 L108 28 Z" fill="#f5c542" stroke="#c9842a" strokeWidth="1.4" /> : null}
          <g className="arm arm-back">
            <rect x="40" y="132" width="12" height="64" rx="6" fill={shade(skin, 0.1)} />
            <g className="forearm">
              <rect x="41" y="186" width="10" height="58" rx="5" fill={skin} />
            </g>
          </g>
          <g className="leg leg-l">
            <rect x="64" y="186" width="14" height="82" rx="6" fill={pants} />
            <g className="shin">
              <rect x="65" y="258" width="12" height="78" rx="5" fill={pants} />
              <ellipse cx="71" cy="340" rx="12" ry="5" fill="#14110f" />
            </g>
          </g>
          <g className="leg leg-r">
            <rect x="82" y="186" width="14" height="82" rx="6" fill={shade(pants, 0.16)} />
            <g className="shin">
              <rect x="83" y="258" width="12" height="78" rx="5" fill={shade(pants, 0.16)} />
              <ellipse cx="89" cy="340" rx="12" ry="5" fill="#14110f" />
            </g>
          </g>
          <path className="torso" d="M54 124 Q50 156 64 192 L96 192 Q110 156 106 124 Q94 134 80 132 Q66 134 54 124 Z" fill={shirt} />
          <path d="M54 126 Q40 134 38 152 Q46 160 58 148 Z" fill={shade(shirt, 0.08)} />
          <path d="M106 126 Q120 134 122 152 Q114 160 102 148 Z" fill={shade(shirt, 0.14)} />
          <path d="M70 124 H90 L87 134 H73 Z" fill={shade(shirt, 0.18)} />
          <g className="arm arm-front">
            <rect x="108" y="134" width="12" height="62" rx="6" fill={skin} />
            <g className="forearm">
              <rect x="109" y="186" width="10" height="56" rx="5" fill={mix(skin, 0.08)} />
            </g>
          </g>
          <rect x="74" y="112" width="12" height="16" rx="5" fill={skin} />
          <ellipse cx="58" cy="108" rx="4.5" ry="6" fill={skin} />
          <ellipse cx="102" cy="108" rx="4.5" ry="6" fill={shade(skin, 0.06)} />
          <path d="M56 112 C54 78 106 78 104 112 C106 122 98 130 90 132 L70 132 C62 130 54 122 56 112 Z" fill={hair} />
        </g>
      </svg>
    </div>
  );
}

function Arm({ origin, skin, side, long = false }: { origin: string; skin: string; side: "back" | "front"; long?: boolean }) {
  const [x, y] = origin.split(" ").map(Number);
  const upper = long ? 54 : 54;
  const fore = long ? 48 : 48;
  const thick = long ? 12 : 15;
  return (
    <g className={`arm arm-${side}`}>
      <rect x={x - thick / 2} y={y} width={thick} height={upper} rx={thick / 2} fill={skin} />
      <g className="forearm">
        <rect x={x - thick / 2 + 1} y={y + upper - 6} width={thick - 2} height={fore} rx={(thick - 2) / 2} fill={skin} />
        <circle cx={x} cy={y + upper + fore - 8} r={long ? 5.5 : 7} fill={mix(skin, 0.08)} />
      </g>
    </g>
  );
}

function Leg({ origin, fill, side, long = false }: { origin: string; fill: string; side: "l" | "r"; long?: boolean }) {
  const [x, y] = origin.split(" ").map(Number);
  const thigh = long ? 96 : 64;
  const shin = long ? 88 : 58;
  const thick = long ? 13 : 18;
  return (
    <g className={`leg leg-${side}`}>
      <rect x={x - thick / 2} y={y} width={thick} height={thigh} rx={thick / 2} fill={fill} />
      <g className="shin">
        <rect x={x - thick / 2 + 1} y={y + thigh - 10} width={thick - 2} height={shin} rx={(thick - 2) / 2} fill={fill} />
        <ellipse cx={x + 1} cy={y + thigh + shin - 16} rx={long ? 11 : 14} ry={long ? 5 : 7} fill="#2a241e" />
      </g>
    </g>
  );
}

function Hair({ look, hair, layer, compact = false }: { look: Look; hair: string; layer: "back" | "front"; compact?: boolean }) {
  if (layer === "back") {
    if (look.hair === "Afro") return <circle cx="100" cy={compact ? 76 : 82} r={compact ? 32 : 54} fill={hair} />;
    if (look.hair === "Long") return <path d={compact ? "M78 96 Q74 190 84 250 Q100 268 116 250 Q126 190 122 96 Q112 78 100 76 Q88 78 78 96 Z" : "M62 90 Q58 160 70 210 Q100 230 130 210 Q142 160 138 90 Q120 70 100 70 Q80 70 62 90 Z"} fill={hair} />;
    if (look.hair === "Ponytail") return <path d="M128 78 Q168 90 162 150 Q150 168 140 140 Q150 100 132 90 Z" fill={hair} />;
    if (look.hair === "Locs" || look.hair === "Braids") {
      const xs = compact ? [82, 90, 98, 108, 116, 124] : [64, 76, 88, 112, 124, 136];
      return (
        <g fill={hair}>
          {xs.map((x, index) => (
            <rect key={x} x={x} y={(compact ? 86 : 70) + (index % 2) * 4} width={look.hair === "Locs" ? 6 : 3.5} height={compact ? 110 : look.hair === "Locs" ? 78 : 64} rx="3" />
          ))}
        </g>
      );
    }
    return null;
  }
  if (look.hair === "Bun") return <circle cx="100" cy="46" r="14" fill={hair} />;
  if (look.hair === "Low cut") return <path d="M66 78 Q100 48 134 78 Q120 64 100 62 Q80 64 66 78 Z" fill={hair} />;
  if (look.hair === "Headwrap") return <path d="M58 86 Q62 42 100 38 Q140 42 144 88 Q120 70 100 72 Q78 70 58 86 Z" fill={look.cloth} />;
  if (look.hair === "Afro") return null;
  return <path d="M68 70 Q100 46 132 70 Q120 60 100 58 Q80 60 68 70 Z" fill={hair} />;
}

function mix(hex: string, amount: number) {
  const [r, g, b] = rgb(hex);
  const channel = (value: number) => Math.round(value + (255 - value) * amount);
  return `rgb(${channel(r)}, ${channel(g)}, ${channel(b)})`;
}

function shade(hex: string, amount: number) {
  const [r, g, b] = rgb(hex);
  const channel = (value: number) => Math.round(value * (1 - amount));
  return `rgb(${channel(r)}, ${channel(g)}, ${channel(b)})`;
}

function rgb(hex: string) {
  const clean = hex.replace("#", "");
  return [parseInt(clean.slice(0, 2), 16), parseInt(clean.slice(2, 4), 16), parseInt(clean.slice(4, 6), 16)];
}
