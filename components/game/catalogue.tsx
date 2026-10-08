"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Canvas } from "@react-three/fiber";
import { LaptopSet } from "@/components/game/kit-mesh";
import { SHOP, SHOP_CATEGORIES, cedis, type ShopCategory, type ShopItem } from "@/lib/game/world";
import { jobLine } from "@/lib/game/essentials";

type Sort = "cheap" | "dear" | "stars" | "new";
type TierPick = "all" | "starter" | "mid" | "luxury";

export function Catalogue({
  cash,
  owned,
  stored = [],
  floor,
  cupboard = {},
  onBuy,
  onCart,
  onUse,
  onClose,
}: {
  cash: number;
  owned: string[];
  stored?: string[];
  floor?: string;
  cupboard?: Record<string, number>;
  onBuy: (id: string) => void;
  onCart?: (ids: string[]) => boolean;
  onUse?: (id: string) => void;
  onClose: () => void;
}) {
  const [category, setCategory] = useState<ShopCategory>("design");
  const [edge, setEdge] = useState({ left: false, right: true });
  const [query, setQuery] = useState("");
  const [tier, setTier] = useState<TierPick>("all");
  const [sort, setSort] = useState<Sort>("cheap");
  const [job, setJob] = useState("all");
  const [cart, setCart] = useState<string[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const q = query.trim().toLowerCase();
  const items = SHOP.filter((item) => {
    if (q) {
      const blob = `${item.name} ${item.category} ${item.job ?? ""} ${item.detail}`.toLowerCase();
      if (!blob.includes(q)) return false;
    } else if (item.category !== category) return false;
    if (tier !== "all" && (item.tier ?? "mid") !== tier) return false;
    if (job !== "all" && item.job !== job) return false;
    return true;
  }).sort((a, b) => (sort === "dear" ? b.price - a.price : sort === "stars" ? b.stars - a.stars || a.price - b.price : sort === "new" ? Number(b.id.startsWith("e-")) - Number(a.id.startsWith("e-")) || a.price - b.price : a.price - b.price));
  const shown = preview ? SHOP.find((item) => item.id === preview) : null;

  function reveal(id: ShopCategory) {
    const list = listRef.current;
    const node = list?.querySelector<HTMLButtonElement>(`[data-tab="${id}"]`);
    if (!list || !node) return;
    const left = node.offsetLeft - list.clientWidth / 2 + node.offsetWidth / 2;
    list.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }

  function choose(id: ShopCategory, focus = false) {
    setCategory(id);
    const node = listRef.current?.querySelector<HTMLButtonElement>(`[data-tab="${id}"]`);
    if (focus) node?.focus();
    reveal(id);
  }

  function onTabsKey(event: KeyboardEvent<HTMLDivElement>) {
    const ids = SHOP_CATEGORIES.map((chip) => chip.id);
    const index = ids.indexOf(category);
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      const step = event.key === "ArrowRight" ? 1 : -1;
      choose(ids[(index + step + ids.length) % ids.length], true);
    }
    if (event.key === "Home") {
      event.preventDefault();
      choose(ids[0], true);
    }
    if (event.key === "End") {
      event.preventDefault();
      choose(ids[ids.length - 1], true);
    }
  }

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const measure = () => {
      setEdge({
        left: list.scrollLeft > 8,
        right: list.scrollLeft + list.clientWidth < list.scrollWidth - 8,
      });
    };
    measure();
    list.addEventListener("scroll", measure, { passive: true });
    const watch = new ResizeObserver(measure);
    watch.observe(list);
    return () => {
      list.removeEventListener("scroll", measure);
      watch.disconnect();
    };
  }, []);

  return (
    <div className="absolute inset-x-0 bottom-0 z-40 flex max-h-[min(78vh,100dvh-4.5rem)] flex-col rounded-t-[28px] bg-[#f7f8fb] pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-16px_50px_rgba(22,32,60,.2)]">
      <div className="sticky top-0 z-20 shrink-0 bg-[#f7f8fb]">
        <div className="flex items-center justify-between px-5 pt-4">
          <h2 className="font-display text-2xl tracking-tight text-[#121212]">Catalogue</h2>
          <button type="button" onClick={onClose} className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-[#5c6b82] shadow-sm">
            Hide
          </button>
        </div>
        <div className="relative mt-2.5">
          <div className={`pointer-events-none absolute inset-y-0 left-0 z-10 w-7 bg-gradient-to-r from-[#f7f8fb] to-transparent transition-opacity ${edge.left ? "opacity-100" : "opacity-0"}`} />
          <div className={`pointer-events-none absolute inset-y-0 right-0 z-10 w-7 bg-gradient-to-l from-[#f7f8fb] to-transparent transition-opacity ${edge.right ? "opacity-100" : "opacity-0"}`} />
          <div
            ref={listRef}
            role="tablist"
            aria-label="Shop categories"
            aria-orientation="horizontal"
            onKeyDown={onTabsKey}
            className="no-scrollbar flex snap-x snap-mandatory gap-1 overflow-x-auto scroll-smooth px-4 py-0.5 sm:gap-1.5 sm:px-5"
          >
            {SHOP_CATEGORIES.map((chip) => {
              const on = category === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  role="tab"
                  data-tab={chip.id}
                  id={`shop-tab-${chip.id}`}
                  aria-selected={on}
                  aria-controls="shop-grid"
                  tabIndex={on ? 0 : -1}
                  onClick={() => choose(chip.id)}
                  className={`inline-flex shrink-0 snap-start items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[13px] font-semibold transition active:scale-[0.97] sm:px-3 sm:text-sm ${on ? "bg-[#121212] text-[#fff1c9]" : "bg-[#fff1c9] text-[#121212] hover:bg-[#ffe7a3]"}`}
                >
                  <CategoryIcon id={chip.id} active={on} />
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 px-4 pb-2 pt-3 sm:px-5">
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPreview(null);
            }}
            placeholder="Search pots, soap, tanks"
            className="min-w-0 flex-1 rounded-full bg-white px-4 py-2 text-sm text-[#121212] outline-none"
          />
          <select value={sort} onChange={(event) => setSort(event.target.value as Sort)} className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-[#121212]">
            <option value="cheap">Cheap first</option>
            <option value="dear">Dear first</option>
            <option value="stars">Popular</option>
            <option value="new">New</option>
          </select>
          <select value={job} onChange={(event) => setJob(event.target.value)} className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-[#121212]">
            <option value="all">Any job</option>
            {["cook", "serve", "bathe", "sleep", "cool", "power", "water", "wash", "clean", "store", "guard", "care", "food", "faith", "fit", "health", "groom", "kid", "desk", "pet", "yard", "motor"].map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-1.5 overflow-x-auto px-4 pb-2 sm:px-5">
          {(["all", "starter", "mid", "luxury"] as TierPick[]).map((id) => (
            <button key={id} type="button" onClick={() => setTier(id)} className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${tier === id ? "bg-[#121212] text-white" : "bg-white text-[#121212]"}`}>
              {id === "all" ? "Any price" : id}
            </button>
          ))}
        </div>
        <p className="px-4 pb-3 text-xs text-[#8b97ab] sm:px-5">
          Wallet {cedis(cash)}
          {q ? " · searching every shelf" : ""}
          {cart.length ? ` · ${cart.length} in the cart` : ""}
        </p>
      </div>
      {shown ? (
        <Preview
          item={shown}
          cash={cash}
          owned={owned}
          stored={stored}
          floor={floor}
          qty={cupboard[shown.id] ?? 0}
          onBack={() => setPreview(null)}
          onBuy={() => onBuy(shown.id)}
          onAdd={() => setCart((list) => [...list, shown.id])}
          onUse={onUse && shown.stock ? () => onUse(shown.id) : undefined}
        />
      ) : (
        <div id="shop-grid" role="tabpanel" aria-labelledby={`shop-tab-${category}`} className="grid min-h-0 flex-1 grid-cols-2 content-start gap-3 overflow-auto px-4 pb-6 sm:grid-cols-3">
          {items.map((item) => {
            const have = !item.consume && !item.stock && owned.includes(item.id);
            const parked = stored.includes(item.id);
            const laid = item.kind === "floor" && floor === item.id;
            const qty = cupboard[item.id] ?? 0;
            return (
              <button key={item.id} type="button" onClick={() => setPreview(item.id)} className="rounded-[22px] bg-white p-3 text-left shadow-sm">
                <span className="flex items-center justify-between text-[11px] text-[#8b97ab]">
                  <span>{item.size}</span>
                  <span className="text-[#e0b44a]">{"★".repeat(item.stars)}</span>
                </span>
                <span className="mt-1 grid h-28 place-items-center">
                  <ItemArt item={item} />
                </span>
                <span className="mt-1 block text-sm font-semibold text-[#121212]">{item.name}</span>
                <span className="mt-1 block text-sm font-bold text-[#006B3F]">
                  {laid ? "On the floor" : parked ? "Stored" : have ? "In the house" : item.stock && qty > 0 ? `${qty} in the cupboard` : cedis(item.price)}
                </span>
              </button>
            );
          })}
          {items.length === 0 ? <p className="col-span-2 py-8 text-sm text-[#5c6b82]">Nothing on that shelf.</p> : null}
        </div>
      )}
      {cart.length && onCart ? (
        <div className="flex items-center justify-between gap-3 border-t border-[#e6ebf2] bg-white px-4 py-3">
          <p className="text-sm font-semibold text-[#121212]">
            {cart.length} · {cedis(cart.reduce((sum, id) => sum + (SHOP.find((item) => item.id === id)?.price ?? 0), 0))}
          </p>
          <button
            type="button"
            onClick={() => {
              if (onCart(cart)) setCart([]);
            }}
            className="rounded-full bg-[#006B3F] px-4 py-2 text-sm font-bold text-white"
          >
            Deliver
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Preview({
  item,
  owned,
  stored,
  floor,
  qty,
  onBack,
  onBuy,
  onAdd,
  onUse,
}: {
  item: ShopItem;
  cash: number;
  owned: string[];
  stored: string[];
  floor?: string;
  qty: number;
  onBack: () => void;
  onBuy: () => void;
  onAdd: () => void;
  onUse?: () => void;
}) {
  const have = !item.consume && !item.stock && owned.includes(item.id);
  const parked = stored.includes(item.id);
  const laid = item.kind === "floor" && floor === item.id;
  return (
    <div className="min-h-0 flex-1 overflow-auto px-4 pb-6 sm:px-5">
      <button type="button" onClick={onBack} className="text-sm font-semibold text-[#5c6b82]">
        Back to the shelf
      </button>
      <div className="mt-3 grid place-items-center rounded-[22px] bg-white py-4">
        {item.kind === "desk" ? <DeskPreview /> : <ItemArt item={item} />}
      </div>
      <h3 className="mt-3 font-display text-2xl text-[#121212]">{item.name}</h3>
      <p className="mt-1 text-sm text-[#5c6b82]">{item.detail}</p>
      <p className="mt-2 text-sm font-semibold text-[#121212]">{jobLine(item.job)}</p>
      <p className="mt-1 text-xs text-[#8b97ab]">
        {item.tier ?? "mid"} · {item.where ?? "shop"} · {item.stock ? "cupboard" : item.size === "yard" ? "compound" : "placed in the house"}
        {item.unlock ? ` · clout ${item.unlock}` : ""}
        {item.stock ? ` · ${qty} in the cupboard` : have ? " · already in the house" : ""}
      </p>
      {item.asset ? <p className="mt-2 text-xs text-[#8b97ab]">{item.asset}</p> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {onUse && qty > 0 ? (
          <button type="button" onClick={onUse} className="rounded-full bg-[#121212] px-4 py-2 text-sm font-bold text-white">
            Use
          </button>
        ) : null}
        {!laid && !(have && !parked && item.kind !== "floor") ? (
          <button type="button" onClick={onBuy} className="rounded-full bg-[#006B3F] px-4 py-2 text-sm font-bold text-white">
            {parked ? "Put it out" : item.kind === "floor" && have ? "Lay this floor" : `Buy ${cedis(item.price)}`}
          </button>
        ) : null}
        {!have || item.stock ? (
          <button type="button" onClick={onAdd} className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#121212] shadow-sm">
            Add to cart
          </button>
        ) : null}
      </div>
    </div>
  );
}

function CategoryIcon({ id, active }: { id: ShopCategory; active: boolean }) {
  const stroke = active ? "#FCD116" : "#121212";
  const common = { fill: "none", stroke, strokeWidth: 1.75, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden>
      {id === "design" ? (
        <>
          <rect {...common} x="3.5" y="3.5" width="7" height="7" rx="1.5" />
          <rect {...common} x="13.5" y="3.5" width="7" height="7" rx="1.5" />
          <rect {...common} x="3.5" y="13.5" width="7" height="7" rx="1.5" />
          <rect {...common} x="13.5" y="13.5" width="7" height="7" rx="1.5" />
        </>
      ) : null}
      {id === "sleep" ? (
        <>
          <path {...common} d="M3 18V8M3 14h18v4H3zM21 18v-7" />
          <path {...common} d="M7 11.5a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2z" />
        </>
      ) : null}
      {id === "kitchen" ? (
        <>
          <path {...common} d="M7 10h10v5a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-3v-5z" />
          <path {...common} d="M5 12H3M21 12h-2M9 7c.4-2 5.6-2 6 0" />
        </>
      ) : null}
      {id === "bath" ? (
        <>
          <path {...common} d="M5 12h14v2.5A4.5 4.5 0 0 1 14.5 19h-5A4.5 4.5 0 0 1 5 14.5V12z" />
          <path {...common} d="M7 12V8a2 2 0 0 1 2-2h1" />
        </>
      ) : null}
      {id === "comfort" ? (
        <>
          <path {...common} d="M5 11V8.5A2.5 2.5 0 0 1 7.5 6h9A2.5 2.5 0 0 1 19 8.5V11" />
          <path {...common} d="M3.5 12h17v4.5A2.5 2.5 0 0 1 18 19H6a2.5 2.5 0 0 1-2.5-2.5V12z" />
        </>
      ) : null}
      {id === "fun" ? (
        <>
          <rect {...common} x="3" y="6" width="18" height="11" rx="2" />
          <path {...common} d="M8 20.5h8" />
        </>
      ) : null}
      {id === "skills" ? (
        <>
          <path {...common} d="M12 6v13" />
          <path {...common} d="M12 7H6.5A2.5 2.5 0 0 0 4 9.5V19h8" />
          <path {...common} d="M12 7h5.5A2.5 2.5 0 0 1 20 9.5V19h-8" />
        </>
      ) : null}
      {id === "light" ? (
        <>
          <path {...common} d="M9 18h6M10 21h4" />
          <path {...common} d="M12 3a5.5 5.5 0 0 0-3 10c.6.6 1 1.4 1 2h4c0-.6.4-1.4 1-2A5.5 5.5 0 0 0 12 3z" />
        </>
      ) : null}
      {id === "decor" ? (
        <>
          <path {...common} d="M12 21v-7M8 21h8" />
          <path {...common} d="M12 14c-4-.8-6.5-4.5-5-8 3.2.2 5 3 5 8z" />
          <path {...common} d="M12 14c4-.8 6.5-4.5 5-8-3.2.2-5 3-5 8z" />
        </>
      ) : null}
      {id === "pets" ? (
        <>
          <circle {...common} cx="7" cy="8" r="1.7" />
          <circle {...common} cx="12" cy="6" r="1.7" />
          <circle {...common} cx="17" cy="8" r="1.7" />
          <ellipse {...common} cx="12" cy="15.5" rx="4" ry="3" />
        </>
      ) : null}
      {id === "luxury" ? (
        <>
          <path {...common} d="M12 21 5.5 9 12 3.5 18.5 9 12 21z" />
          <path {...common} d="M5.5 9h13" />
        </>
      ) : null}
      {id !== "design" && id !== "sleep" && id !== "kitchen" && id !== "bath" && id !== "comfort" && id !== "fun" && id !== "skills" && id !== "light" && id !== "decor" && id !== "pets" && id !== "luxury" ? (
        <rect {...common} x="5" y="6" width="14" height="12" rx="2" />
      ) : null}
    </svg>
  );
}

function ItemArt({ item }: { item: ShopItem }) {
  if (item.kind === "jet") return <JetPreview color={item.color} heavy={item.id === "heavy-jet"} />;
  return (
    <svg viewBox="0 0 120 90" className="h-24 w-28" aria-hidden>
      <ellipse cx="60" cy="80" rx="36" ry="5.5" fill="#121212" opacity="0.08" />
      <Piece item={item} />
    </svg>
  );
}

function JetPreview({ color, heavy }: { color: string; heavy: boolean }) {
  return (
    <Canvas
      className="h-24 w-28"
      camera={{ position: [2.1, 3.4, 2.1], fov: 26 }}
      dpr={1}
      frameloop="demand"
      gl={{ antialias: true, alpha: true }}
      onCreated={({ gl }) => gl.setClearColor("#ffffff", 0)}
      style={{ width: "7rem", height: "6rem", pointerEvents: "none" }}
    >
      <ambientLight intensity={0.72} />
      <directionalLight position={[4, 7, 3]} intensity={1.25} />
      <directionalLight position={[-3, 2, -2]} intensity={0.35} />
      <JetModel color={color} heavy={heavy} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[1.35, 32]} />
        <meshBasicMaterial color="#121212" transparent opacity={0.08} />
      </mesh>
    </Canvas>
  );
}

function JetModel({ color, heavy }: { color: string; heavy: boolean }) {
  const body = heavy ? 2.15 : 1.85;
  const span = heavy ? 2.7 : 2.25;
  return (
    <group position={[0, 0.15, 0]} rotation={[0, 0.85, 0]}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.16, body, 6, 16]} />
        <meshLambertMaterial color={color} />
      </mesh>
      <mesh position={[body / 2 + 0.16, 0.02, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.16, 0.36, 16]} />
        <meshLambertMaterial color={color} />
      </mesh>
      <mesh position={[0.38, 0.14, 0]}>
        <sphereGeometry args={[0.11, 16, 12]} />
        <meshLambertMaterial color="#8fb4d4" />
      </mesh>
      <mesh position={[0.05, -0.02, 0]}>
        <boxGeometry args={[0.5, 0.035, span]} />
        <meshLambertMaterial color={color} />
      </mesh>
      <mesh position={[-body / 2 + 0.12, 0.22, 0]}>
        <boxGeometry args={[0.28, 0.34, 0.045]} />
        <meshLambertMaterial color={color} />
      </mesh>
      <mesh position={[-body / 2 + 0.16, 0.08, 0]}>
        <boxGeometry args={[0.22, 0.03, 0.62]} />
        <meshLambertMaterial color={color} />
      </mesh>
      <Engine at={[0.05, -0.08, span * 0.32]} />
      <Engine at={[0.05, -0.08, -span * 0.32]} />
      {heavy ? (
        <>
          <Engine at={[0.38, -0.08, span * 0.32]} />
          <Engine at={[0.38, -0.08, -span * 0.32]} />
        </>
      ) : null}
    </group>
  );
}

function Engine({ at }: { at: [number, number, number] }) {
  return (
    <mesh position={at} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.07, 0.085, 0.34, 12]} />
      <meshLambertMaterial color="#3a3f46" />
    </mesh>
  );
}

function Piece({ item }: { item: ShopItem }) {
  const { id, kind, color, size } = item;
  if (kind === "floor") return <FloorCard a={color} b={item.accent ?? "#fff"} />;
  if (id === "armchair") return <Armchair color={color} />;
  if (kind === "throne") return <ThroneArt />;
  if (kind === "chair") return <PlasticChair color={color} />;
  if (kind === "sofa") return <Sofa color={color} seats={size.startsWith("3") ? 3 : 2} />;
  if (kind === "bed") return <Bed color={color} />;
  if (kind === "wall") return <Crate color={color} />;
  if (kind === "desk") return <LaptopDeskArt />;
  if (kind === "table") return <Table color={color} />;
  if (kind === "fan") return <Fan />;
  if (kind === "ac") return <AirCon />;
  if (kind === "food") return <KenkeyPlate />;
  if (kind === "lamp") return <Bulb color={color} />;
  if (kind === "fridge") return <FridgeArt />;
  if (kind === "stove") return <StoveArt simple={id === "kerosene"} />;
  if (id === "counter") return <CounterArt />;
  if (kind === "sink") return <SinkArt />;
  if (kind === "toilet") return <ToiletArt />;
  if (kind === "shower") return <ShowerArt />;
  if (kind === "tv") return <Screen wide={size.startsWith("2")} />;
  if (kind === "guitar") return <Guitar color={color} />;
  if (kind === "weights") return <WeightsArt />;
  if (kind === "plant") return <Plant color={color} />;
  if (kind === "rug") return <FloorCard a={color} b={item.accent ?? "#1f8a70"} />;
  if (id === "mirror") return <MirrorArt />;
  if (kind === "curtain") return <CurtainArt color={color} />;
  if (kind === "painting") return <PaintingArt />;
  if (kind === "tank") return <TankArt />;
  if (kind === "statue") return <LionArt />;
  if (kind === "vault") return <VaultArt />;
  if (kind === "dog") return <DogArt />;
  if (kind === "cat") return <CatArt />;
  if (kind === "bird") return <ParrotArt />;
  if (id === "pan") return <Pot color={color} />;
  if (id === "pillow") return <Pillow color={color} />;
  if (id === "kente") return <KenteArt />;
  if (id === "net") return <NetArt />;
  if (id === "bucket" || id === "bowl-set") return <Bucket color={color} />;
  if (id === "transistor") return <RadioArt />;
  if (id === "speaker") return <Speaker color={color} />;
  if (id === "book") return <Books color={color} />;
  if (id === "generator" || id === "yellow-gen" || id === "solar") return <Generator color={color} />;
  return <Crate color={color} />;
}

function FloorCard({ a, b }: { a: string; b: string }) {
  const tiles: Block[] = [];
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      tiles.push({ x: -18 + col * 12, y: 0, z: -12 + row * 10, w: 11, h: 1.2, d: 9, color: (col + row) % 2 === 0 ? a : b });
    }
  }
  return <Blocks items={tiles} />;
}

function Screen({ wide }: { wide: boolean }) {
  const w = wide ? 72 : 52;
  const frame = wide ? "#c4a46a" : "#1c1c1c";
  return (
    <Blocks
      items={[
        { x: -w * 0.22, y: 0, z: -8, w: w * 0.44, h: 3, d: 16, color: frame },
        { x: -3, y: 3, z: -4, w: 6, h: 8, d: 6, color: frame },
        { x: -w / 2, y: 11, z: -2, w, h: wide ? 34 : 26, d: 4, color: frame },
        { x: -w / 2 + 3, y: 14, z: 1, w: w - 6, h: wide ? 28 : 20, d: 2, color: "#16324f" },
      ]}
    />
  );
}

function Guitar({ color }: { color: string }) {
  return (
    <g>
      <path d="M58 18 L66 18 L62 48 L58 48 Z" fill="#5c4030" />
      <ellipse cx="60" cy="58" rx="16" ry="18" fill={color} />
      <circle cx="60" cy="58" r="4" fill="#5c4030" />
    </g>
  );
}

function Plant({ color }: { color: string }) {
  return (
    <g>
      <path d="M48 70 h24 l-4 -16 h-16 Z" fill="#cbbba6" />
      <path d="M60 54 L48 28 L58 40 Z" fill={color} />
      <path d="M60 50 L74 24 L66 42 Z" fill={color} />
    </g>
  );
}

function Pet({ color }: { color: string }) {
  return (
    <g>
      <ellipse cx="58" cy="58" rx="22" ry="12" fill={color} />
      <circle cx="78" cy="50" r="10" fill={color} />
      <circle cx="82" cy="48" r="4" fill="#f4efe6" />
    </g>
  );
}

function Bird({ color }: { color: string }) {
  return (
    <g>
      <path d="M58 72 v-28" stroke="#5c4030" strokeWidth="4" />
      <circle cx="58" cy="38" r="10" fill={color} />
      <path d="M66 36 h10" stroke="#e7c85a" strokeWidth="2" />
    </g>
  );
}

type Block = { x: number; y: number; z: number; w: number; h: number; d: number; color: string };

function at(x: number, y: number, z: number): [number, number] {
  return [60 + (x - z) * 1.15, 64 + (x + z) * 0.56 - y * 1.12];
}

function Blocks({ items }: { items: Block[] }) {
  const sorted = [...items].sort((a, b) => a.x + a.z + a.y * 0.2 - (b.x + b.z + b.y * 0.2));
  return (
    <g>
      {sorted.map((block, index) => {
        const { x, y, z, w, h, d, color } = block;
        const p = (dx: number, dy: number, dz: number) => at(x + dx, y + dy, z + dz);
        const front = [p(0, 0, d), p(0, h, d), p(w, h, d), p(w, 0, d)];
        const side = [p(w, 0, 0), p(w, h, 0), p(w, h, d), p(w, 0, d)];
        const top = [p(0, h, 0), p(w, h, 0), p(w, h, d), p(0, h, d)];
        const points = (pts: [number, number][]) => pts.map(([px, py]) => `${px.toFixed(1)},${py.toFixed(1)}`).join(" ");
        return (
          <g key={index}>
            <polygon points={points(front)} fill={shade(color, 0.58)} />
            <polygon points={points(side)} fill={shade(color, 0.8)} />
            <polygon points={points(top)} fill={tint(color, 0.22)} />
          </g>
        );
      })}
    </g>
  );
}

function PlasticChair({ color }: { color: string }) {
  const leg = { w: 3.6, h: 16, d: 3.6, color };
  return (
    <Blocks
      items={[
        { x: -11, y: 0, z: -8, ...leg },
        { x: 8, y: 0, z: -8, ...leg },
        { x: -11, y: 0, z: 10, ...leg },
        { x: 8, y: 0, z: 10, ...leg },
        { x: -13, y: 16, z: -8, w: 26, h: 3.8, d: 22, color },
        { x: -12, y: 19.8, z: -8, w: 24, h: 18, d: 3.4, color },
      ]}
    />
  );
}

function Armchair({ color }: { color: string }) {
  const wood = "#8a623c";
  return (
    <Blocks
      items={[
        { x: -12, y: 0, z: -6, w: 3.2, h: 6, d: 3.2, color: wood },
        { x: 9, y: 0, z: -6, w: 3.2, h: 6, d: 3.2, color: wood },
        { x: -12, y: 0, z: 8, w: 3.2, h: 6, d: 3.2, color: wood },
        { x: 9, y: 0, z: 8, w: 3.2, h: 6, d: 3.2, color: wood },
        { x: -14, y: 6, z: -2, w: 4, h: 10, d: 14, color },
        { x: 10, y: 6, z: -2, w: 4, h: 10, d: 14, color },
        { x: -10, y: 6, z: -8, w: 20, h: 14, d: 4, color },
        { x: -10, y: 8, z: -3, w: 20, h: 4, d: 14, color },
      ]}
    />
  );
}

function Sofa({ color, seats }: { color: string; seats: number }) {
  const seat = seats === 3 ? 11 : 12;
  const total = seats * seat + (seats - 1) * 0.7;
  const x0 = -total / 2;
  const wood = "#6b4a30";
  const items: Block[] = [
    { x: x0 + 1, y: 0, z: -5, w: 3, h: 5, d: 3, color: wood },
    { x: x0 + total - 4, y: 0, z: -5, w: 3, h: 5, d: 3, color: wood },
    { x: x0 + 1, y: 0, z: 8, w: 3, h: 5, d: 3, color: wood },
    { x: x0 + total - 4, y: 0, z: 8, w: 3, h: 5, d: 3, color: wood },
    { x: x0 - 3, y: 5, z: -3, w: 3.2, h: 9, d: 14, color },
    { x: x0 + total, y: 5, z: -3, w: 3.2, h: 9, d: 14, color },
    { x: x0, y: 5, z: -6, w: total, h: 4, d: 16, color },
  ];
  for (let i = 0; i < seats; i += 1) {
    const x = x0 + i * (seat + 0.7);
    items.push({ x, y: 9, z: -6, w: seat, h: 11, d: 3.6, color });
    items.push({ x: x + 0.4, y: 9, z: -2, w: seat - 0.8, h: 3.2, d: 11, color });
  }
  return <Blocks items={items} />;
}

function Bed({ color }: { color: string }) {
  const wood = "#7a4e30";
  return (
    <Blocks
      items={[
        { x: -16, y: 0, z: -8, w: 3, h: 5, d: 3, color: wood },
        { x: 13, y: 0, z: -8, w: 3, h: 5, d: 3, color: wood },
        { x: -16, y: 0, z: 10, w: 3, h: 5, d: 3, color: wood },
        { x: 13, y: 0, z: 10, w: 3, h: 5, d: 3, color: wood },
        { x: -16, y: 5, z: -10, w: 32, h: 10, d: 3, color: wood },
        { x: -15, y: 5, z: -7, w: 30, h: 4, d: 20, color: "#f3efe8" },
        { x: -13, y: 9, z: -1, w: 26, h: 2.4, d: 13, color },
        { x: -10, y: 9.2, z: -6, w: 8, h: 2.2, d: 5, color: "#ffffff" },
        { x: 1, y: 9.2, z: -6, w: 8, h: 2.2, d: 5, color: "#f7f4ef" },
      ]}
    />
  );
}

function DeskPreview() {
  return (
    <Canvas
      className="h-44 w-full"
      camera={{ position: [2.6, 2.15, 2.35], fov: 30 }}
      dpr={1}
      frameloop="demand"
      gl={{ antialias: true, alpha: true }}
      onCreated={({ gl }) => gl.setClearColor("#ffffff", 0)}
      style={{ width: "100%", height: "11rem", pointerEvents: "none" }}
    >
      <ambientLight intensity={0.82} />
      <directionalLight position={[4, 7, 3]} intensity={1.2} />
      <directionalLight position={[-3, 2, -2]} intensity={0.28} />
      <group position={[0.45, 0, 0.05]}>
        <LaptopSet />
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[1.7, 32]} />
        <meshBasicMaterial color="#121212" transparent opacity={0.06} />
      </mesh>
    </Canvas>
  );
}

function LaptopDeskArt() {
  const wood = "#f3cca8";
  const leg = { w: 2.4, h: 13, d: 2.4, color: "#e7c9a0" };
  const screen = [at(-2, 22, -6), at(10, 22, -6), at(10, 30, -1), at(-2, 30, -1)];
  return (
    <g>
      <Blocks
        items={[
          { x: -22, y: 0, z: -2, w: 10, h: 16, d: 12, color: "#f9a39e" },
          { x: -20, y: 16, z: -4, w: 8, h: 10, d: 3, color: "#f9a39e" },
          { x: -8, y: 0, z: -6, ...leg },
          { x: 8, y: 0, z: -6, ...leg },
          { x: -8, y: 0, z: 6, ...leg },
          { x: 8, y: 0, z: 6, ...leg },
          { x: -10, y: 13, z: -8, w: 22, h: 2.2, d: 16, color: wood },
          { x: -4, y: 15.2, z: -2, w: 12, h: 0.8, d: 8, color: "#a3b6b6" },
        ]}
      />
      <polygon points={screen.map((point) => point.join(",")).join(" ")} fill="#6d7c86" />
      <polygon points={[at(-1, 22.4, -5.2), at(9, 22.4, -5.2), at(9, 28.6, -1.6), at(-1, 28.6, -1.6)].map((point) => point.join(",")).join(" ")} fill="#d7ece8" />
    </g>
  );
}

function Table({ color }: { color: string }) {
  const leg = { w: 3, h: 14, d: 3, color };
  const [px, py] = at(0, 18.2, 2);
  return (
    <g>
      <Blocks
        items={[
          { x: -14, y: 0, z: -8, ...leg },
          { x: 11, y: 0, z: -8, ...leg },
          { x: -14, y: 0, z: 8, ...leg },
          { x: 11, y: 0, z: 8, ...leg },
          { x: -16, y: 14, z: -10, w: 32, h: 3, d: 20, color },
        ]}
      />
      <ellipse cx={px} cy={py} rx="7" ry="3" fill="#f7f4ef" />
      <ellipse cx={px} cy={py - 0.6} rx="3.5" ry="1.5" fill="#c4563a" />
    </g>
  );
}

function Fan() {
  const [hx, hy] = at(0, 32, 2);
  return (
    <g>
      <Blocks
        items={[
          { x: -12, y: 0, z: -6, w: 24, h: 4, d: 14, color: "#243044" },
          { x: -2, y: 4, z: -2, w: 4, h: 20, d: 4, color: "#9aafc2" },
        ]}
      />
      <ellipse cx={hx - 6} cy={hy - 4} rx="14" ry="14" fill="#b7c9da" />
      <ellipse cx={hx} cy={hy} rx="14" ry="14" fill="#f7fbfe" />
      <ellipse cx={hx} cy={hy} rx="9" ry="9" fill="#d5e6f2" />
      <circle cx={hx} cy={hy} r="3" fill="#7f97ab" />
    </g>
  );
}

function AirCon() {
  return (
    <Blocks
      items={[
        { x: -20, y: 10, z: -4, w: 40, h: 14, d: 12, color: "#f4f7fa" },
        { x: -12, y: 15, z: 8, w: 16, h: 2.2, d: 1.4, color: "#c5d0dc" },
        { x: 10, y: 15, z: 8, w: 4, h: 4, d: 1.2, color: "#7eb6e8" },
      ]}
    />
  );
}

function Bowl({ color }: { color: string }) {
  return (
    <g>
      <path d="M28 48 h64 l-8 16 a28 10 0 0 1 -48 0 Z" fill="#f4efe6" />
      <ellipse cx="60" cy="48" rx="32" ry="11" fill="#fff" />
      <ellipse cx="60" cy="48" rx="24" ry="8" fill={color} />
      <circle cx="50" cy="46" r="5" fill="#c4563a" />
      <circle cx="66" cy="50" r="3.5" fill="#3c8f4e" />
    </g>
  );
}

function Bulb({ color }: { color: string }) {
  return (
    <g>
      <circle cx="60" cy="36" r="22" fill={color} opacity="0.35" />
      <circle cx="60" cy="38" r="14" fill={color} />
      <path d="M52 50 h16 l-2 8 h-12 Z" fill="#d9d3c6" />
      <rect x="54" y="58" width="12" height="6" rx="1" fill="#b7b0a2" />
    </g>
  );
}

function Pot({ color }: { color: string }) {
  return (
    <g>
      <path d="M36 46 h-10 v10 h10" fill="none" stroke={shade(color, 0.7)} strokeWidth="3" strokeLinecap="round" />
      <path d="M84 46 h10 v10 h-10" fill="none" stroke={shade(color, 0.7)} strokeWidth="3" strokeLinecap="round" />
      <path d="M36 40 v16 a24 9 0 0 0 48 0 V40" fill={color} />
      <ellipse cx="60" cy="40" rx="24" ry="8" fill={tint(color, 0.28)} />
      <ellipse cx="60" cy="37" rx="12" ry="4" fill={shade(color, 0.75)} />
    </g>
  );
}

function Pillow({ color }: { color: string }) {
  return (
    <g>
      <rect x="22" y="36" width="76" height="30" rx="14" fill={shade(color, 0.82)} stroke={shade(color, 0.55)} strokeWidth="3" />
      <path d="M36 51 h48" stroke="#fff" strokeWidth="2.5" opacity="0.8" strokeLinecap="round" />
    </g>
  );
}

function KenteArt() {
  const stripes = ["#CE1126", "#FCD116", "#006B3F", "#FCD116", "#CE1126", "#006B3F"];
  return (
    <g>
      <rect x="28" y="16" width="64" height="5" rx="2" fill="#5c4030" />
      {stripes.map((fill, index) => (
        <rect key={fill + index} x={30 + index * 10} y="21" width="10" height="52" fill={fill} />
      ))}
    </g>
  );
}

function NetArt() {
  return (
    <g>
      <rect x="34" y="58" width="52" height="12" rx="2" fill="#6b4428" />
      <rect x="38" y="50" width="44" height="10" rx="2" fill="#5b7fd6" />
      <rect x="32" y="22" width="3" height="40" fill="#f7f4ef" />
      <rect x="85" y="22" width="3" height="40" fill="#f7f4ef" />
      <rect x="32" y="20" width="56" height="4" fill="#f7f4ef" />
      <rect x="34" y="24" width="52" height="36" fill="#e7f2ea" opacity="0.72" />
      <path d="M34 32 h52 M34 42 h52 M34 52 h52 M46 24 v36 M60 24 v36 M74 24 v36" stroke="#9bb5a4" strokeWidth="1" />
    </g>
  );
}

function KenkeyPlate() {
  return (
    <g>
      <ellipse cx="60" cy="62" rx="28" ry="10" fill="#f4efe6" />
      <ellipse cx="48" cy="48" rx="14" ry="10" fill="#e7c85a" />
      <path d="M62 42 c8 2 16 8 16 14 c-6 2 -14 0 -18 -6 Z" fill="#c4563a" />
      <circle cx="74" cy="50" r="2" fill="#1c1c1c" />
    </g>
  );
}

function StoveArt({ simple }: { simple?: boolean }) {
  return (
    <g>
      <rect x={simple ? 38 : 28} y="36" width={simple ? 44 : 64} height="36" rx="3" fill={simple ? "#3d4a3a" : "#f4f7fa"} />
      <rect x={simple ? 42 : 32} y="30" width={simple ? 36 : 56} height="8" fill="#1c1c1c" />
      {simple ? (
        <circle cx="60" cy="34" r="8" fill="none" stroke="#9aa7b5" strokeWidth="3" />
      ) : (
        <>
          <circle cx="46" cy="34" r="6" fill="none" stroke="#9aa7b5" strokeWidth="2.5" />
          <circle cx="74" cy="34" r="6" fill="none" stroke="#9aa7b5" strokeWidth="2.5" />
          <circle cx="46" cy="48" r="5" fill="none" stroke="#9aa7b5" strokeWidth="2" />
          <circle cx="74" cy="48" r="5" fill="none" stroke="#9aa7b5" strokeWidth="2" />
        </>
      )}
    </g>
  );
}

function CounterArt() {
  return (
    <g>
      <rect x="24" y="40" width="72" height="28" fill="#c4894f" />
      <rect x="22" y="34" width="76" height="8" fill="#e7c9a0" />
      <rect x="30" y="48" width="26" height="16" fill="#f4efe6" />
      <rect x="64" y="48" width="26" height="16" fill="#f4efe6" />
    </g>
  );
}

function RadioArt() {
  return (
    <g>
      <rect x="28" y="40" width="64" height="28" rx="3" fill="#c4894f" />
      <circle cx="46" cy="54" r="9" fill="#1c2430" />
      <circle cx="46" cy="54" r="3" fill="#4d5b70" />
      <circle cx="72" cy="52" r="4" fill="#e7c85a" />
      <path d="M78 40 L90 18" stroke="#d7dde4" strokeWidth="2" />
    </g>
  );
}

function Bucket({ color }: { color: string }) {
  return (
    <g>
      <path d="M40 36 h40 l-6 28 h-28 Z" fill={color} />
      <ellipse cx="60" cy="36" rx="20" ry="7" fill={tint(color, 0.3)} />
      <path d="M42 30 C42 18 78 18 78 30" fill="none" stroke="#8aa0b4" strokeWidth="2.5" />
    </g>
  );
}

function Speaker({ color }: { color: string }) {
  return (
    <g>
      <rect x="38" y="22" width="44" height="52" rx="12" fill={color} />
      <circle cx="60" cy="42" r="12" fill="#2a3344" />
      <circle cx="60" cy="42" r="5" fill="#4d5b70" />
      <circle cx="60" cy="64" r="3" fill="#006B3F" />
    </g>
  );
}

function Books({ color }: { color: string }) {
  return (
    <g>
      <path d="M30 58 L78 46 L86 52 L38 64 Z" fill="#c4563a" />
      <path d="M34 50 L82 38 L90 44 L42 56 Z" fill={color} />
      <path d="M38 42 L86 30 L94 36 L46 48 Z" fill="#1f8a70" />
    </g>
  );
}

function Generator({ color }: { color: string }) {
  return (
    <g>
      <path d="M28 40 L78 28 L96 38 L46 50 Z" fill={tint(color, 0.2)} />
      <path d="M46 50 L96 38 L96 58 L46 70 Z" fill={color} />
      <path d="M28 40 L46 50 L46 70 L28 60 Z" fill={shade(color, 0.75)} />
      <path d="M56 46 L84 38" stroke="#d7e7f4" strokeWidth="2" />
      <path d="M58 52 L80 46" stroke="#d7e7f4" strokeWidth="2" />
      <circle cx="70" cy="58" r="3" fill="#e7c85a" />
    </g>
  );
}

function FridgeArt() {
  return (
    <g>
      <rect x="38" y="16" width="40" height="60" rx="3" fill="#f7f7f7" />
      <path d="M58 16 v60" stroke="#d5dde3" strokeWidth="2" />
      <rect x="48" y="28" width="3" height="14" rx="1" fill="#9aa7b5" />
      <rect x="66" y="28" width="3" height="14" rx="1" fill="#9aa7b5" />
    </g>
  );
}

function WeightsArt() {
  return (
    <g>
      <rect x="24" y="48" width="72" height="6" rx="2" fill="#9aa3ad" />
      <circle cx="30" cy="51" r="10" fill="#c4563a" />
      <circle cx="90" cy="51" r="10" fill="#c4563a" />
      <rect x="40" y="62" width="40" height="6" rx="1" fill="#1c1c1c" />
    </g>
  );
}

function ToiletArt() {
  return (
    <g>
      <ellipse cx="58" cy="62" rx="18" ry="8" fill="#f7f7f7" />
      <path d="M42 62 v-8 a16 10 0 0 1 32 0 v8" fill="#e7eef2" />
      <rect x="46" y="28" width="22" height="26" rx="3" fill="#f4f7f8" />
      <rect x="52" y="34" width="10" height="4" rx="1" fill="#c5d0da" />
    </g>
  );
}

function ShowerArt() {
  return (
    <g>
      <rect x="34" y="24" width="48" height="50" rx="4" fill="#d5e7f2" />
      <rect x="40" y="30" width="36" height="38" rx="2" fill="#f7fbfe" opacity="0.7" />
      <circle cx="58" cy="28" r="4" fill="#9aa7b5" />
      <path d="M50 34 v8 M58 34 v10 M66 34 v8" stroke="#7eb6e8" strokeWidth="2" />
      <ellipse cx="58" cy="74" rx="16" ry="4" fill="#c5d0da" />
    </g>
  );
}

function SinkArt() {
  return (
    <g>
      <path d="M28 58 h64 v8 H28 Z" fill="#e7c9a0" />
      <ellipse cx="60" cy="50" rx="22" ry="10" fill="#d5dde3" />
      <ellipse cx="60" cy="50" rx="14" ry="6" fill="#f7f7f7" />
      <path d="M60 40 v-10" stroke="#9aa7b5" strokeWidth="3" />
      <path d="M60 30 h8" stroke="#9aa7b5" strokeWidth="3" />
    </g>
  );
}

function MirrorArt() {
  return (
    <g>
      <rect x="40" y="18" width="36" height="52" rx="4" fill="#8a623c" />
      <rect x="44" y="22" width="28" height="40" rx="2" fill="#d5e7f2" />
      <path d="M48 28 l8 16" stroke="#fff" strokeWidth="2" opacity="0.7" />
      <rect x="54" y="70" width="8" height="8" fill="#6b4428" />
    </g>
  );
}

function CurtainArt({ color }: { color: string }) {
  return (
    <g>
      <rect x="26" y="20" width="68" height="4" rx="2" fill="#8a623c" />
      <path d="M30 24 C34 40 28 60 36 74 L48 74 C40 58 46 40 40 24 Z" fill={color} />
      <path d="M48 24 C54 42 50 60 58 74 L72 74 C62 56 68 40 60 24 Z" fill="#f3e2b0" />
    </g>
  );
}

function PaintingArt() {
  return (
    <g>
      <rect x="28" y="22" width="64" height="48" rx="2" fill="#f4efe6" />
      <rect x="34" y="28" width="52" height="36" fill="#8a623c" />
      <circle cx="48" cy="42" r="6" fill="#FCD116" />
      <path d="M40 58 L52 44 L64 58 Z" fill="#1f8a70" />
    </g>
  );
}

function TankArt() {
  return (
    <g>
      <rect x="30" y="58" width="60" height="8" rx="2" fill="#1c1c1c" />
      <rect x="34" y="28" width="52" height="32" rx="2" fill="#d7eef8" stroke="#7eb6e8" />
      <rect x="38" y="40" width="44" height="16" fill="#2f6f9a" opacity="0.55" />
      <ellipse cx="48" cy="48" rx="6" ry="3" fill="#e07a3d" />
      <ellipse cx="68" cy="44" rx="5" ry="2.5" fill="#FCD116" />
    </g>
  );
}

function LionArt() {
  return (
    <g>
      <rect x="40" y="64" width="36" height="8" fill="#8a623c" />
      <ellipse cx="58" cy="56" rx="16" ry="8" fill="#e0b04a" />
      <circle cx="76" cy="48" r="10" fill="#c4a46a" />
      <circle cx="76" cy="48" r="14" fill="#f0c14b" opacity="0.45" />
      <path d="M86 48 h8" stroke="#8a623c" strokeWidth="2" />
      <path d="M46 52 q-10 8 4 10" fill="none" stroke="#e0b04a" strokeWidth="3" />
    </g>
  );
}

function VaultArt() {
  return (
    <g>
      <rect x="32" y="22" width="52" height="52" rx="4" fill="#4a4e55" />
      <circle cx="58" cy="48" r="16" fill="#2c3138" />
      <circle cx="58" cy="48" r="6" fill="none" stroke="#e0b04a" strokeWidth="3" />
    </g>
  );
}

function DogArt() {
  return (
    <g>
      <ellipse cx="52" cy="58" rx="20" ry="10" fill="#c4894f" />
      <circle cx="74" cy="50" r="9" fill="#c4894f" />
      <ellipse cx="84" cy="52" rx="6" ry="4" fill="#e7c9a0" />
      <ellipse cx="70" cy="42" rx="4" ry="6" fill="#8a623c" />
      <path d="M34 58 q-8 -2 -4 8" fill="none" stroke="#a86b32" strokeWidth="3" />
      <circle cx="78" cy="48" r="1.5" fill="#121212" />
    </g>
  );
}

function CatArt() {
  return (
    <g>
      <ellipse cx="54" cy="60" rx="16" ry="8" fill="#5c6570" />
      <circle cx="72" cy="52" r="8" fill="#5c6570" />
      <path d="M66 46 L70 36 L74 46 Z" fill="#3d4450" />
      <path d="M74 46 L78 36 L82 46 Z" fill="#3d4450" />
      <path d="M40 56 q-6 -14 2 -4" fill="none" stroke="#5c6570" strokeWidth="3" />
      <circle cx="80" cy="54" r="1.5" fill="#e7a0b0" />
    </g>
  );
}

function ParrotArt() {
  return (
    <g>
      <path d="M48 74 v-24" stroke="#6b4428" strokeWidth="4" />
      <ellipse cx="52" cy="46" rx="12" ry="10" fill="#c5ced6" />
      <circle cx="64" cy="38" r="7" fill="#f4f7fa" />
      <path d="M70 38 h8 l-2 3 h-6 Z" fill="#1c1c1c" />
      <path d="M44 50 L36 62 L48 54 Z" fill="#c4563a" />
    </g>
  );
}

function ThroneArt() {
  return (
    <g>
      <path d="M36 70 h44 v-8 H36 Z" fill="#8b1e3f" />
      <path d="M32 62 h52 v-28 H32 Z" fill="#8b1e3f" />
      <path d="M40 34 h8 v-8 h-8 Z" fill="#e0b04a" />
      <circle cx="44" cy="50" r="2" fill="#e0b04a" />
      <circle cx="58" cy="50" r="2" fill="#e0b04a" />
      <circle cx="72" cy="50" r="2" fill="#e0b04a" />
    </g>
  );
}

function Crate({ color }: { color: string }) {
  return (
    <g>
      <path d="M34 36 L74 24 L92 34 L52 46 Z" fill={tint(color, 0.15)} />
      <path d="M52 46 L92 34 L92 58 L52 70 Z" fill={shade(color)} />
      <path d="M34 36 L52 46 L52 70 L34 60 Z" fill={shade(color, 0.72)} />
    </g>
  );
}

function shade(hex: string, amount = 0.82) {
  const raw = hex.replace("#", "");
  if (raw.length !== 6) return hex;
  const channel = (start: number) => Math.max(0, Math.round(Number.parseInt(raw.slice(start, start + 2), 16) * amount));
  return `rgb(${channel(0)} ${channel(2)} ${channel(4)})`;
}

function tint(hex: string, amount: number) {
  const raw = hex.replace("#", "");
  if (raw.length !== 6) return hex;
  const channel = (start: number) => {
    const value = Number.parseInt(raw.slice(start, start + 2), 16);
    return Math.round(value + (255 - value) * amount);
  };
  return `rgb(${channel(0)} ${channel(2)} ${channel(4)})`;
}
