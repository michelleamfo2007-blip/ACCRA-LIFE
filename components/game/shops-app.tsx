"use client";

import { useState } from "react";
import { hireStaff, fireStaff, postShop } from "@/lib/game/shop-run";
import {
  SHOP_TYPES,
  SHOP_VIEWS,
  areasFor,
  askPrice,
  buyShelf,
  cityOf,
  countLine,
  filterShops,
  followShop,
  listingById,
  messageOwner,
  openInCity,
  paintShop,
  priceItem,
  ratingOf,
  refundItem,
  renameShop,
  replyReview,
  restockItem,
  reviewShop,
  reviewsOf,
  setPromo,
  setShopHours,
  shopCities,
  shopStats,
  shopStatus,
  statusLabel,
  stockLeft,
  type ShopCity,
  type ShopListing,
  type ShopStatus,
  type ShopView,
} from "@/lib/game/shops";
import { cedis, type Life, type StepResult } from "@/lib/game/world";

const ICONS = ["🏪", "🍲", "💇", "🛒", "👗", "📱", "🛠️", "🍺", "💊", "💄"];
const COLORS = ["#5b21b6", "#1d4ed8", "#006B3F", "#9f1239", "#0f766e", "#121212"];
const HOURS = ["6:00 – 21:00", "8:00 – 20:00", "10:00 – 22:00", "4:00 pm – 2:00 am"];

function pill(active: boolean) {
  return `shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${active ? "bg-[#121212] text-white" : "bg-white text-[#121212] shadow-sm"}`;
}

function statusClass(status: ShopStatus) {
  if (status === "open") return "bg-[#dcfce7] text-[#166534]";
  if (status === "service") return "bg-[#dbeafe] text-[#1d4ed8]";
  if (status === "sold") return "bg-[#fee2e2] text-[#b91c1c]";
  return "bg-[#e5e7eb] text-[#4b5563]";
}

export function ShopsApp({
  life,
  username,
  onBack,
  onApply,
  onVisit,
}: {
  life: Life;
  username: string;
  onBack: () => void;
  onApply: (result: StepResult) => void;
  onVisit?: (spot: string) => void;
}) {
  const known = shopCities().some((item) => item.id === life.town);
  const [city, setCity] = useState<ShopCity>(known ? (life.town as ShopCity) : "accra");
  const [view, setView] = useState<ShopView>("top");
  const [type, setType] = useState("all");
  const [area, setArea] = useState("all");
  const [text, setText] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [manage, setManage] = useState(false);
  const shop = openId ? listingById(life, username, openId) : null;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#f3f4f6] text-[#121212]">
      <header className="flex items-center gap-1 bg-white px-2 py-2">
        <button
          type="button"
          aria-label="Back"
          onClick={() => {
            if (manage) {
              setManage(false);
              return;
            }
            if (openId) {
              setOpenId(null);
              return;
            }
            onBack();
          }}
          className="grid h-9 w-9 place-items-center rounded-full text-lg"
        >
          ‹
        </button>
        <h1 className="text-base font-bold">{manage ? "Your shop" : shop ? shop.name : "Shops"}</h1>
      </header>
      {manage && shop?.yours ? (
        <OwnerDesk life={life} username={username} shop={shop} onApply={onApply} />
      ) : shop ? (
        <ShopProfile life={life} username={username} shop={shop} onApply={onApply} onManage={() => setManage(true)} onVisit={onVisit} />
      ) : (
        <Directory
          life={life}
          username={username}
          city={city}
          view={view}
          type={type}
          area={area}
          text={text}
          onCity={(next) => {
            setCity(next);
            setArea("all");
          }}
          onView={setView}
          onType={setType}
          onArea={setArea}
          onText={setText}
          onOpen={setOpenId}
        />
      )}
    </div>
  );
}

function Directory({
  life,
  username,
  city,
  view,
  type,
  area,
  text,
  onCity,
  onView,
  onType,
  onArea,
  onText,
  onOpen,
}: {
  life: Life;
  username: string;
  city: ShopCity;
  view: ShopView;
  type: string;
  area: string;
  text: string;
  onCity: (city: ShopCity) => void;
  onView: (view: ShopView) => void;
  onType: (type: string) => void;
  onArea: (area: string) => void;
  onText: (text: string) => void;
  onOpen: (id: string) => void;
}) {
  const rows = filterShops(life, username, { city, view, type, area, text });
  const areas = areasFor(city);
  return (
    <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-3">
      <label className="flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-sm">
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#6b7280]" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
        </svg>
        <input value={text} onChange={(event) => onText(event.target.value)} placeholder="Search shops or items" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
      </label>
      <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
        {shopCities().map((item) => (
          <button key={item.id} type="button" onClick={() => onCity(item.id)} className={pill(city === item.id)}>
            {item.icon} {item.name}
          </button>
        ))}
      </div>
      <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
        {SHOP_VIEWS.map((item) => (
          <button key={item.id} type="button" onClick={() => onView(item.id)} className={pill(view === item.id)}>
            {item.icon} {item.label}
          </button>
        ))}
      </div>
      <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
        {SHOP_TYPES.map((item) => (
          <button key={item.id} type="button" onClick={() => onType(item.id)} className={pill(type === item.id)}>
            {item.icon ? `${item.icon} ` : ""}
            {item.label}
          </button>
        ))}
      </div>
      <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
        <button type="button" onClick={() => onArea("all")} className={pill(area === "all")}>
          All areas
        </button>
        {areas.map((item) => (
          <button key={item} type="button" onClick={() => onArea(item)} className={pill(area === item)}>
            {item}
          </button>
        ))}
      </div>
      <p className="px-1 text-xs font-semibold text-[#6b7280]">{countLine(rows.length, city)}</p>
      <ul className="space-y-2">
        {rows.map((shop) => {
          const status = shopStatus(life, shop);
          const stars = ratingOf(life, shop);
          const kind = SHOP_TYPES.find((item) => item.id === shop.type)?.label ?? shop.type;
          const followed = (life.shopBook?.follows ?? []).includes(shop.id);
          return (
            <li key={shop.id}>
              <button type="button" onClick={() => onOpen(shop.id)} className="flex w-full items-center gap-3 rounded-2xl bg-white px-3 py-2.5 text-left shadow-sm">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-xl text-white" style={{ background: shop.color }}>
                  {shop.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{shop.name}</span>
                  <span className="block truncate text-[11px] text-[#6b7280]">
                    @{shop.owner} · {shop.area}
                    {followed ? " · Following" : ""}
                    {shop.yours ? " · Yours" : ""}
                  </span>
                  <span className="block text-[11px] text-[#374151]">
                    {kind} · {stars.toFixed(1)}★
                  </span>
                </span>
                <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${statusClass(status)}`}>{statusLabel(status)}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {rows.length ? null : <p className="rounded-2xl bg-white px-3 py-4 text-sm text-[#6b7280]">No shop matches that filter.</p>}
    </div>
  );
}

function ShopProfile({
  life,
  username,
  shop,
  onApply,
  onManage,
  onVisit,
}: {
  life: Life;
  username: string;
  shop: ShopListing;
  onApply: (result: StepResult) => void;
  onManage: () => void;
  onVisit?: (spot: string) => void;
}) {
  const [note, setNote] = useState("");
  const [stars, setStars] = useState(5);
  const followed = (life.shopBook?.follows ?? []).includes(shop.id);
  const reviews = reviewsOf(life, shop);
  const kind = SHOP_TYPES.find((item) => item.id === shop.type)?.label ?? shop.type;
  return (
    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3">
      <div className="rounded-3xl p-4 text-white shadow" style={{ background: `linear-gradient(135deg, ${shop.color}, #1e1b4b)` }}>
        <div className="flex items-center gap-3">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-white/20 text-3xl">{shop.emoji}</span>
          <span className="min-w-0 flex-1">
            <span className="block text-lg font-bold leading-tight">{shop.name}</span>
            <span className="block text-sm text-white/80">@{shop.owner}</span>
            <span className="block text-xs text-white/70">
              {shop.area} · {cityOf(shop.city).name}
            </span>
          </span>
          <button
            type="button"
            aria-label="Copy shop link"
            className="grid h-9 w-9 place-items-center rounded-full bg-white/15 text-sm"
            onClick={() => {
              const url = `${window.location.origin}/?shop=${shop.id}`;
              void navigator.clipboard?.writeText(url);
            }}
          >
            🔗
          </button>
        </div>
        <p className="mt-3 text-xs text-white/80">
          {kind} · {ratingOf(life, shop).toFixed(1)}★ · {shop.hours}
        </p>
        <div className="mt-3 flex gap-2">
          {shop.yours ? (
            <button type="button" onClick={onManage} className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#121212]">
              Manage
            </button>
          ) : (
            <>
              <button type="button" onClick={() => onApply(followShop(life, shop.id))} className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#121212]">
                {followed ? "Following" : "Follow"}
              </button>
              <button type="button" onClick={() => onApply(messageOwner(life, shop))} className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold">
                Message owner
              </button>
            </>
          )}
          {shop.yours && shop.spot && onVisit ? (
            <button type="button" onClick={() => onVisit(shop.spot!)} className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold">
              Visit
            </button>
          ) : null}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {shop.items.map((item) => {
          const left = stockLeft(life, item);
          const sold = left <= 0;
          const price = askPrice(life, shop, item);
          const refunded = (life.shopBook?.refunded ?? []).includes(item.id);
          const owned = (life.shopBook?.bought[item.id] ?? 0) > 0;
          return (
            <article key={item.id} className="rounded-2xl bg-white p-2 shadow-sm">
              <div className="relative grid h-16 place-items-center rounded-xl bg-[#f3f4f6] text-3xl">
                {item.emoji}
                {sold ? <span className="absolute right-1 top-1 rounded bg-[#CE1126] px-1.5 py-0.5 text-[10px] font-bold text-white">Sold out</span> : null}
              </div>
              <p className="mt-1 truncate text-sm font-semibold">{item.name}</p>
              <p className="text-[11px] text-[#6b7280]">
                {item.category}
                {item.condition !== "new" ? ` · ${item.condition}` : ""}
              </p>
              {item.effect ? <p className="text-[11px] font-semibold text-[#006B3F]">{item.effect}</p> : null}
              <p className="text-sm font-bold text-[#006B3F]">{price === 0 ? "Free" : cedis(price)}</p>
              <p className="text-[10px] text-[#6b7280]">{sold ? "None left" : `${left} left`}</p>
              {shop.yours ? null : (
                <button
                  type="button"
                  disabled={sold}
                  onClick={() => onApply(buyShelf(life, username, shop.id, item.id))}
                  className={`mt-1 w-full rounded-full py-1.5 text-xs font-bold ${sold ? "bg-[#e5e7eb] text-[#6b7280]" : "bg-[#121212] text-white"}`}
                >
                  {sold ? "Sold out" : "Buy"}
                </button>
              )}
              {!shop.yours && owned && !refunded ? (
                <button type="button" onClick={() => onApply(refundItem(life, username, shop.id, item.id))} className="mt-1 w-full text-[10px] font-semibold text-[#6b7280]">
                  Ask for a refund
                </button>
              ) : null}
            </article>
          );
        })}
      </div>
      <section className="rounded-2xl bg-white p-3 shadow-sm">
        <p className="text-sm font-bold">Reviews</p>
        {reviews.length ? null : <p className="mt-1 text-xs text-[#6b7280]">No reviews yet.</p>}
        <ul className="mt-2 space-y-2">
          {reviews.map((review) => (
            <li key={review.id} className="text-xs">
              <p className="font-semibold">
                @{review.buyer} · {review.stars}★
              </p>
              <p className="text-[#374151]">{review.text}</p>
              {review.reply ? <p className="mt-1 text-[#6b7280]">Owner: {review.reply}</p> : null}
            </li>
          ))}
        </ul>
        {shop.yours ? null : (
          <form
            className="mt-3 space-y-2"
            onSubmit={(event) => {
              event.preventDefault();
              onApply(reviewShop(life, username, shop.id, stars, note));
              setNote("");
            }}
          >
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((score) => (
                <button key={score} type="button" onClick={() => setStars(score)} className={`rounded-full px-2 py-1 text-xs font-bold ${stars === score ? "bg-[#121212] text-white" : "bg-[#f3f4f6]"}`}>
                  {score}★
                </button>
              ))}
            </div>
            <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="How was it?" className="w-full rounded-full bg-[#f3f4f6] px-3 py-2 text-xs outline-none" />
            <button type="submit" className="rounded-full bg-[#121212] px-3 py-1.5 text-xs font-bold text-white">
              Post review
            </button>
          </form>
        )}
      </section>
    </div>
  );
}

function OwnerDesk({ life, username, shop, onApply }: { life: Life; username: string; shop: ShopListing; onApply: (result: StepResult) => void }) {
  const stats = shopStats(life, username, shop.id);
  const [name, setName] = useState(shop.name);
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [prices, setPrices] = useState<Record<string, string>>({});
  const reviews = reviewsOf(life, shop);
  if (!stats) return null;
  return (
    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3">
      <section className="rounded-2xl bg-white p-3 shadow-sm">
        <p className="text-sm font-bold">Today&apos;s books</p>
        <p className="mt-1 text-xs text-[#6b7280]">A fair day at this till. The cash lands when you collect it.</p>
        <dl className="mt-2 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl bg-[#f3f4f6] px-2 py-2">
            <dt className="text-[#6b7280]">Revenue</dt>
            <dd className="font-bold text-[#006B3F]">{cedis(stats.revenue)}</dd>
          </div>
          <div className="rounded-xl bg-[#f3f4f6] px-2 py-2">
            <dt className="text-[#6b7280]">Customers</dt>
            <dd className="font-bold">{stats.customers}</dd>
          </div>
          <div className="rounded-xl bg-[#f3f4f6] px-2 py-2">
            <dt className="text-[#6b7280]">Rating</dt>
            <dd className="font-bold">{stats.stars.toFixed(1)}★</dd>
          </div>
          <div className="rounded-xl bg-[#f3f4f6] px-2 py-2">
            <dt className="text-[#6b7280]">Rank in {cityOf(shop.city).name}</dt>
            <dd className="font-bold">
              {stats.rank} of {stats.of}
            </dd>
          </div>
        </dl>
        <p className="mt-2 text-xs text-[#6b7280]">Wallet {cedis(stats.cash)} · promo {stats.promo}%</p>
        {stats.low.length ? <p className="mt-1 text-xs font-semibold text-[#b91c1c]">Low stock: {stats.low.join(", ")}</p> : <p className="mt-1 text-xs text-[#166534]">Shelves are stocked.</p>}
      </section>
      <section className="rounded-2xl bg-white p-3 shadow-sm">
        <p className="text-sm font-bold">Sign</p>
        <form
          className="mt-2 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            onApply(renameShop(life, shop.id, name));
          }}
        >
          <input value={name} onChange={(event) => setName(event.target.value)} className="min-w-0 flex-1 rounded-full bg-[#f3f4f6] px-3 py-2 text-sm outline-none" />
          <button type="submit" className="rounded-full bg-[#121212] px-3 text-xs font-bold text-white">
            Save
          </button>
        </form>
        <div className="mt-2 flex flex-wrap gap-1">
          {COLORS.map((color) => (
            <button key={color} type="button" aria-label={color} onClick={() => onApply(paintShop(life, shop.id, color, shop.emoji))} className="h-7 w-7 rounded-full border border-black/10" style={{ background: color }} />
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {ICONS.map((icon) => (
            <button key={icon} type="button" onClick={() => onApply(paintShop(life, shop.id, shop.color, icon))} className="rounded-full bg-[#f3f4f6] px-2 py-1 text-sm">
              {icon}
            </button>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {HOURS.map((hours) => (
            <button key={hours} type="button" onClick={() => onApply(setShopHours(life, shop.id, hours))} className="rounded-full bg-[#f3f4f6] px-2 py-1 text-[11px] font-semibold">
              {hours}
            </button>
          ))}
        </div>
        <div className="mt-2 flex gap-1">
          {[0, 10, 20].map((percent) => (
            <button key={percent} type="button" onClick={() => onApply(setPromo(life, shop.id, percent))} className={`rounded-full px-2 py-1 text-[11px] font-bold ${stats.promo === percent ? "bg-[#121212] text-white" : "bg-[#f3f4f6]"}`}>
              {percent}% off
            </button>
          ))}
        </div>
        <button type="button" onClick={() => onApply(postShop(life, shop.id))} className="mt-2 rounded-full bg-[#121212] px-3 py-1.5 text-xs font-bold text-white">
          Post the shop
        </button>
      </section>
      <section className="rounded-2xl bg-white p-3 shadow-sm">
        <p className="text-sm font-bold">Shelf</p>
        <ul className="mt-2 space-y-2">
          {shop.items.map((item) => {
            const left = stockLeft(life, item);
            const price = prices[item.id] ?? String(askPrice(life, shop, item));
            return (
              <li key={item.id} className="flex items-center gap-2 text-xs">
                <span className="text-lg">{item.emoji}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{item.name}</span>
                  <span className={left <= 2 ? "text-[#b91c1c]" : "text-[#6b7280]"}>{left} left</span>
                </span>
                <input value={price} onChange={(event) => setPrices((current) => ({ ...current, [item.id]: event.target.value }))} className="w-16 rounded-full bg-[#f3f4f6] px-2 py-1 text-right outline-none" />
                <button type="button" onClick={() => onApply(priceItem(life, shop.id, item.id, Number(price) || 0))} className="rounded-full bg-[#f3f4f6] px-2 py-1 font-bold">
                  Set
                </button>
                <button type="button" onClick={() => onApply(restockItem(life, username, shop.id, item.id))} className="rounded-full bg-[#121212] px-2 py-1 font-bold text-white">
                  +4
                </button>
              </li>
            );
          })}
        </ul>
      </section>
      <section className="rounded-2xl bg-white p-3 shadow-sm">
        <p className="text-sm font-bold">Staff</p>
        <ul className="mt-2 space-y-1 text-xs">
          {stats.staff.map((person) => (
            <li key={person.id} className="flex items-center justify-between gap-2">
              <span>
                {person.name} · {person.role} · {cedis(person.pay)}
              </span>
              <button type="button" onClick={() => onApply(fireStaff(life, shop.id, person.id))} className="font-semibold text-[#b91c1c]">
                Let go
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex flex-wrap gap-1">
          {stats.pool
            .filter((person) => !stats.staff.some((row) => row.id === person.id))
            .map((person) => (
              <button key={person.id} type="button" onClick={() => onApply(hireStaff(life, shop.id, person.id))} className="rounded-full bg-[#f3f4f6] px-2 py-1 text-[11px] font-semibold">
                Hire {person.name} · {cedis(person.pay)}
              </button>
            ))}
        </div>
      </section>
      <section className="rounded-2xl bg-white p-3 shadow-sm">
        <p className="text-sm font-bold">Another city</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {shopCities()
            .filter((item) => item.id !== shop.city)
            .map((item) => (
              <button key={item.id} type="button" onClick={() => onApply(openInCity(life, shop.id, item.id))} className="rounded-full bg-[#f3f4f6] px-2 py-1 text-[11px] font-semibold">
                {item.icon} {item.name}
              </button>
            ))}
        </div>
      </section>
      <section className="rounded-2xl bg-white p-3 shadow-sm">
        <p className="text-sm font-bold">Reviews</p>
        {reviews.length ? null : <p className="mt-1 text-xs text-[#6b7280]">Buyers have not written yet.</p>}
        {reviews.map((review) => (
          <form
            key={review.id}
            className="mt-2 space-y-1"
            onSubmit={(event) => {
              event.preventDefault();
              onApply(replyReview(life, shop.id, review.id, replies[review.id] ?? ""));
              setReplies((current) => ({ ...current, [review.id]: "" }));
            }}
          >
            <p className="text-xs">
              @{review.buyer} · {review.stars}★ — {review.text}
            </p>
            {review.reply ? <p className="text-xs text-[#6b7280]">You: {review.reply}</p> : null}
            <input value={replies[review.id] ?? ""} onChange={(event) => setReplies((current) => ({ ...current, [review.id]: event.target.value }))} placeholder="Reply" className="w-full rounded-full bg-[#f3f4f6] px-3 py-1.5 text-xs outline-none" />
            <button type="submit" className="text-[11px] font-bold">
              Reply
            </button>
          </form>
        ))}
      </section>
    </div>
  );
}
