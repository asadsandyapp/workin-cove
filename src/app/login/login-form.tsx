"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm({
  nextPath,
  error,
}: {
  nextPath: string;
  error?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [localError, setLocalError] = useState(error || "");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setLocalError("");
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });
    setPending(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setLocalError(data.error || "Login failed");
      return;
    }
    router.push(nextPath);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue="admin@workincove.local"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          defaultValue="1122"
          required
        />
      </div>
      {localError ? (
        <p className="text-sm text-red-700">{localError}</p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
