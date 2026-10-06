import { AuthForm } from "@/components/auth-form";
import { PageHeader } from "@/components/page-header";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; as?: string }> }) {
  const { next = "/", as } = await searchParams;
  const goAdmin = as === "admin" || next.startsWith("/admin");
  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-5 py-10 lg:grid-cols-2">
      <PageHeader
        eyebrow="Account"
        title={goAdmin ? "Editor desk." : "Welcome back."}
        lede={goAdmin ? "Sign in as admin to open the AccraLife desk, photos, and approvals." : "Save places, review the rooms, and keep a list that is actually yours."}
      />
      <div>
        <AuthForm mode="login" next={goAdmin ? "/admin" : next} email={goAdmin ? "admin@accralife.app" : ""} />
        <div className="mt-4 rounded-[28px] border border-dashed border-line p-4 text-sm text-ink-soft">
          <p className="font-semibold text-ink">Demo access</p>
          <p className="mt-2">
            Admin link ·{" "}
            <a href="/login?as=admin&next=/admin" className="font-semibold text-ink underline">
              /login?as=admin
            </a>
          </p>
          <p>Editor · admin@accralife.app</p>
          <p>Member · ama@accralife.app</p>
          <p>Password · AccraLife!26</p>
        </div>
      </div>
    </div>
  );
}
