import { AuthForm } from "@/components/auth-form";
import { PageHeader } from "@/components/page-header";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "/" } = await searchParams;
  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-5 py-10 lg:grid-cols-2">
      <PageHeader eyebrow="Account" title="Welcome back." lede="Save places, review the rooms, and keep a list that is actually yours." />
      <div>
        <AuthForm mode="login" next={next} />
        <div className="mt-4 rounded-[28px] border border-dashed border-line p-4 text-sm text-ink-soft">
          <p className="font-semibold text-ink">Demo access</p>
          <p className="mt-2">Editor · admin@accralife.app</p>
          <p>Member · ama@accralife.app</p>
          <p>Password · AccraLife!26</p>
        </div>
      </div>
    </div>
  );
}
