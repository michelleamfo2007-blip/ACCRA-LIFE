import { EventBrowser } from "@/components/event-browser";
import { PageHeader } from "@/components/page-header";
import { allEvents, getViewer } from "@/lib/server/content";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Events",
  description: "What is happening in Accra today, this weekend, and the weeks ahead.",
};

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ when?: string; area?: string; category?: string; price?: string }>;
}) {
  const params = await searchParams;
  const viewer = await getViewer();
  const events = allEvents();
  return (
    <div>
      <PageHeader eyebrow="Accra, dated" title="What’s on" lede="Today, tomorrow, this weekend, and the plans worth putting in the group chat." />
      <EventBrowser events={events} saved={[...viewer.savedEvents]} initial={params} />
    </div>
  );
}
