"use client";

export function IsoHuman({
  skin = "#8d5a3b",
  shirt = "#ec4899",
  pants = "#1c1917",
  hair = "Bob",
  cloth = shirt,
  crown = false,
  pose = "idle",
  face = 1,
  className = "",
}: {
  skin?: string;
  shirt?: string;
  pants?: string;
  hair?: string;
  cloth?: string;
  crown?: boolean;
  pose?: "idle" | "walk" | "act" | "sit";
  face?: 1 | -1;
  className?: string;
}) {
  const shirtShade = mix(shirt, 0.22);
  const pantsShade = mix(pants, 0.2);
  const skinShade = mix(skin, 0.16);
  return (
    <div className={`sim sim-tall sim-${pose} ${className}`} style={{ transform: face < 0 ? "scaleX(-1)" : undefined }} aria-hidden>
      <svg viewBox="18 4 64 164" className="h-full w-auto overflow-visible">
        <ellipse cx="50" cy="160" rx="16" ry="4.5" fill="rgba(0,0,0,.22)" />
        <g className="sim-bob">
          {crown ? <path d="M30 18 L36 6 L44 16 L50 2 L56 16 L64 6 L70 18 Z" fill="#f5c542" stroke="#c9842a" strokeWidth="1.2" /> : null}
          <g className="arm arm-back">
            <rect x="24" y="62" width="9" height="28" rx="4" fill={skinShade} />
            <g className="forearm">
              <rect x="25" y="86" width="8" height="26" rx="4" fill={skinShade} />
            </g>
          </g>
          <g className="leg leg-l">
            <rect x="38" y="96" width="10" height="32" rx="4" fill={pants} />
            <g className="shin">
              <rect x="39" y="124" width="8" height="30" rx="3.5" fill={pants} />
              <rect x="36" y="150" width="14" height="6" rx="2" fill="#14110f" />
            </g>
          </g>
          <g className="leg leg-r">
            <rect x="52" y="96" width="10" height="32" rx="4" fill={pantsShade} />
            <g className="shin">
              <rect x="53" y="124" width="8" height="30" rx="3.5" fill={pantsShade} />
              <rect x="50" y="150" width="14" height="6" rx="2" fill="#14110f" />
            </g>
          </g>
          <path className="torso" d="M32 58 H68 L64 100 H36 Z" fill={shirt} />
          <path d="M54 58 H68 L64 100 H54 Z" fill={shirtShade} />
          <g className="arm arm-front">
            <rect x="66" y="62" width="9" height="28" rx="4" fill={skin} />
            <g className="forearm">
              <rect x="67" y="86" width="8" height="26" rx="4" fill={skin} />
            </g>
          </g>
          <Hair hair={hair} cloth={cloth} />
          <rect x="46" y="50" width="8" height="10" rx="3" fill={skin} />
          <circle cx="50" cy="40" r="14" fill={skin} />
          <path d="M62 36 H68 L66 52 H60 Z" fill={skinShade} />
          <ellipse cx="44.5" cy="39" rx="2.4" ry="2.8" fill="#1a140f" />
          <ellipse cx="55.5" cy="39" rx="2.4" ry="2.8" fill="#1a140f" />
          <ellipse cx="45.2" cy="38.2" rx="0.8" ry="1" fill="#fff8ee" />
          <ellipse cx="56.2" cy="38.2" rx="0.8" ry="1" fill="#fff8ee" />
          <path d="M42.2 34.6 H47.6" stroke="#1a140f" strokeWidth="1.1" strokeLinecap="round" />
          <path d="M52.4 34.6 H57.8" stroke="#1a140f" strokeWidth="1.1" strokeLinecap="round" />
          <path d="M45.5 46.2 Q50 50 54.5 46.2" stroke="#6a3030" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}

function Hair({ hair, cloth }: { hair: string; cloth: string }) {
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

function mix(hex: string, amount: number) {
  const clean = hex.replace("#", "");
  if (clean.length < 6) return hex;
  const channel = (start: number) => Math.round(parseInt(clean.slice(start, start + 2), 16) * (1 - amount));
  return `rgb(${channel(0)}, ${channel(2)}, ${channel(4)})`;
}
