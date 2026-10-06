"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AuthForm({ mode, next = "/" }: { mode: "login" | "signup"; next?: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError("");
    const response = await fetch(mode === "login" ? "/api/auth/login" : "/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
      }),
    });
    setPending(false);
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(data.error || "Something went wrong.");
      return;
    }
    router.push(next.startsWith("/") ? next : "/");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-[28px] border border-line bg-card p-5">
      {mode === "signup" ? <Input name="name" label="Name" /> : null}
      <Input name="email" label="Email" type="email" />
      <Input name="password" label="Password" type="password" />
      <button type="submit" disabled={pending} className="w-full rounded-full bg-clay px-5 py-3 text-sm font-semibold text-white">
        {pending ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
      </button>
      <button type="button" disabled className="w-full rounded-full border border-line px-5 py-3 text-sm font-semibold text-muted">
        Continue with Google · coming soon
      </button>
      {error ? <p className="text-sm text-clay">{error}</p> : null}
      <p className="text-sm text-muted">
        {mode === "login" ? (
          <>
            New here? <Link href="/signup" className="font-semibold text-ink">Create an account</Link>
          </>
        ) : (
          <>
            Already have an account? <Link href="/login" className="font-semibold text-ink">Sign in</Link>
          </>
        )}
      </p>
    </form>
  );
}

function Input({ name, label, type = "text" }: { name: string; label: string; type?: string }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input name={name} type={type} required className="mt-2 w-full rounded-2xl border border-line bg-paper px-3 py-3" />
    </label>
  );
}
