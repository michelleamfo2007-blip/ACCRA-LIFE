import Link from "next/link";

export function PageHeader({
  eyebrow,
  title,
  lede,
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
}) {
  return (
    <header className="mx-auto max-w-7xl px-5 pb-2 pt-10 sm:pt-14">
      {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay">{eyebrow}</p> : null}
      <h1 className="mt-2 max-w-4xl font-display text-4xl tracking-tight text-ink sm:text-6xl">{title}</h1>
      {lede ? <p className="mt-4 max-w-2xl text-lg leading-8 text-ink-soft">{lede}</p> : null}
    </header>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  href,
  action = "See all",
}: {
  eyebrow?: string;
  title: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        {eyebrow ? <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-clay">{eyebrow}</p> : null}
        <h2 className="font-display text-3xl tracking-tight text-ink sm:text-4xl">{title}</h2>
      </div>
      {href ? (
        <Link href={href} className="shrink-0 text-sm font-medium text-ink underline-offset-4 hover:underline">
          {action}
        </Link>
      ) : null}
    </div>
  );
}

export function KenteRule({ className = "" }: { className?: string }) {
  return (
    <div
      className={`h-1 w-24 rounded-full bg-[linear-gradient(90deg,#1a1613_0_18%,#c24d2c_18%_46%,#b08968_46%_72%,#1b2e27_72%_100%)] ${className}`}
    />
  );
}
