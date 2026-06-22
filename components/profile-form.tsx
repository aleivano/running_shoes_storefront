"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updateProfile, type ProfileActionState } from "@/app/actions/profile";
import type { Profile } from "@/lib/types";

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-orange-500 px-5 py-3 font-black text-neutral-950 transition hover:bg-orange-400 disabled:bg-neutral-700 disabled:text-neutral-400"
    >
      {pending ? "Saving..." : "Save profile"}
    </button>
  );
}

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, formAction] = useActionState<ProfileActionState, FormData>(
    updateProfile,
    {},
  );

  return (
    <form action={formAction} className="grid gap-5 rounded-lg border border-white/10 bg-neutral-900 p-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-orange-300">
          Profile
        </p>
        <h1 className="mt-2 text-3xl font-black text-white">Account details</h1>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-neutral-200">
          Username
          <input
            name="username"
            defaultValue={profile.username}
            required
            minLength={3}
            className="rounded-md border border-white/10 bg-neutral-950 px-4 py-3 text-white outline-none focus:border-orange-300"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-neutral-200">
          Display name
          <input
            name="displayName"
            defaultValue={profile.displayName ?? ""}
            className="rounded-md border border-white/10 bg-neutral-950 px-4 py-3 text-white outline-none focus:border-orange-300"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-neutral-200">
          Phone
          <input
            name="phone"
            defaultValue={profile.phone ?? ""}
            className="rounded-md border border-white/10 bg-neutral-950 px-4 py-3 text-white outline-none focus:border-orange-300"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-neutral-200">
          Avatar URL
          <input
            name="avatarUrl"
            defaultValue={profile.avatarUrl ?? ""}
            className="rounded-md border border-white/10 bg-neutral-950 px-4 py-3 text-white outline-none focus:border-orange-300"
          />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <SaveButton />
        {state.error ? <p className="text-sm text-red-200">{state.error}</p> : null}
        {state.success ? <p className="text-sm text-orange-200">{state.success}</p> : null}
      </div>
    </form>
  );
}
