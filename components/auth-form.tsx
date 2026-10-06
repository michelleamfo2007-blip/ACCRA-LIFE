"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AuthForm({
  mode,
  next = "/",
  email = "",
}: {
  mode: "login" | "signup";
  next?: string;
  email?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [emailValue, setEmailValue] = useState(email);
  const [passwordValue, setPasswordValue] = useState("");

  async function signIn(payload: { email: string; password: string; name?: string }, go = next) {
    setPending(true);
    setError("");
    const response = await fetch(mode === "login" ? "/api/auth/login" : "/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setPending(false);
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(data.error || "Something went wrong.");
      return false;
    }
    router.push(go.startsWith("/") ? go : "/");
    router.refresh();
    return true;
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await signIn({
      name: String(form.get("name") || ""),
      email: String(form.get("email") || ""),
      password: String(form.get("password") || ""),
    });
  }

  async function demo(as: "admin" | "member") {
    const demoEmail = as === "admin" ? "admin@accralife.app" : "ama@accralife.app";
    setEmailValue(demoEmail);
    setPasswordValue("AccraLife!26");
    await signIn({ email: demoEmail, password: "AccraLife!26" }, as === "admin" ? "/admin" : next);
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-[28px] border border-line bg-card p-5">
      {mode === "signup" ? <Input name="name" label="Name" /> : null}
      <label className="block text-sm font-medium">
        Email
        <input
          name="email"
          type="email"
          required
          value={emailValue}
          onChange={(event) => setEmailValue(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-line bg-paper px-3 py-3"
        />
      </label>
      <label className="block text-sm font-medium">
        Password
        <input
          name="password"
          type="password"
          required
          value={passwordValue}
          onChange={(event) => setPasswordValue(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-line bg-paper px-3 py-3"
        />
      </label>
      <button type="submit" disabled={pending} className="w-full rounded-full bg-clay px-5 py-3 text-sm font-semibold text-white">
        {pending ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
      </button>
      {mode === "login" ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <button type="button" disabled={pending} onClick={() => demo("admin")} className="rounded-full bg-[#121212] px-4 py-3 text-sm font-semibold text-white">
            Sign in as admin
          </button>
          <button type="button" disabled={pending} onClick={() => demo("member")} className="rounded-full border border-line px-4 py-3 text-sm font-semibold">
            Sign in as member
          </button>
        </div>
      ) : null}
      <button type="button" disabled className="w-full rounded-full border border-line px-5 py-3 text-sm font-semibold text-muted">
        Continue with Google · coming soon
      </button>
      {error ? <p className="text-sm text-clay">{error}</p> : null}
      <p className="text-sm text-muted">
        {mode === "login" ? (
          <>
            New here?{" "}
            <Link href="/signup" className="font-semibold text-ink">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-ink">
              Sign in
            </Link>
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
