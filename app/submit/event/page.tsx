import { PageHeader } from "@/components/page-header";
import { SubmitEventForm } from "@/components/submit-forms";

export const metadata = { title: "Submit an event" };

export default function SubmitEventPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 pb-16">
      <PageHeader eyebrow="Submissions" title="Submit an event" lede="Parties, suppers, openings, beach days. We review every submission before it hits the city guide." />
      <SubmitEventForm />
    </div>
  );
}
