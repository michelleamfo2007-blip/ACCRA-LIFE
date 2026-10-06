import { AuthForm } from "@/components/auth-form";
import { PageHeader } from "@/components/page-header";

export const metadata = { title: "Create account" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "/" } = await searchParams;
  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-5 py-10 lg:grid-cols-2">
      <PageHeader eyebrow="Account" title="Join AccraLife." lede="Email and password for now. Google sign-in can plug into the same account later." />
      <AuthForm mode="signup" next={next} />
    </div>
  );
}
