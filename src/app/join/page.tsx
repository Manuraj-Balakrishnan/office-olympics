"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageEnter, PageItem } from "@/components/layout/PageEnter";

export default function JoinLandingPage() {
  const router = useRouter();
  const [code, setCode] = useState("");

  return (
    <PageEnter className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-16">
      <PageItem>
        <Link href="/" className="btn-secondary inline-flex w-fit !py-2 text-sm">
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>
      </PageItem>
      <PageItem>
        <h1 className="font-display text-4xl font-extrabold md:text-5xl">
          Join a tournament
        </h1>
        <p className="mt-2 text-[var(--fg-muted)]">
          Enter the code from your host (e.g. OFFICE-4821).
        </p>
      </PageItem>
      <PageItem>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="OFFICE-4821"
          className="input-field text-center font-display text-2xl font-bold tracking-wider"
          autoCapitalize="characters"
        />
      </PageItem>
      <PageItem>
        <button
          type="button"
          className="btn-primary w-full text-xl"
          disabled={code.trim().length < 6}
          onClick={() => router.push(`/join/${code.trim().toUpperCase()}`)}
        >
          Continue
        </button>
      </PageItem>
    </PageEnter>
  );
}
