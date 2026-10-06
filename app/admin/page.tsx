import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin-dashboard";
import { currentUser } from "@/lib/server/guard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin" };

export default async function AdminPage() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "admin") redirect("/");
  return (
    <div className="bg-paper-deep/40">
      <div className="mx-auto max-w-7xl px-5 pt-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-clay">Desk</p>
        <h1 className="mt-2 font-display text-5xl">AccraLife admin</h1>
      </div>
      <AdminDashboard />
    </div>
  );
}
