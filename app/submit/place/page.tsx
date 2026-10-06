import { PageHeader } from "@/components/page-header";
import { SubmitPlaceForm } from "@/components/submit-forms";

export const metadata = { title: "Add a place" };

export default function SubmitPlacePage() {
  return (
    <div className="mx-auto max-w-3xl px-5 pb-16">
      <PageHeader eyebrow="Submissions" title="Add a place" lede="Tell us what Accra is missing. Listings go to an editor before they appear." />
      <SubmitPlaceForm />
    </div>
  );
}
