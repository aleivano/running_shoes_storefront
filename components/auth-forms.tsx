"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  registerUser,
  signInWithEmailOrUsername,
  signInWithOAuth,
  type AuthActionState,
} from "@/app/actions/auth";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-orange-500 px-5 py-3 font-black text-neutral-950 transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-400"
    >
      {pending ? "Working..." : label}
    </button>
  );
}

function ActionError({ state }: { state: AuthActionState }) {
  if (!state.error) {
    return null;
  }

  return (
    <p className="rounded-md border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">
      {state.error}
    </p>
  );
}

const authErrorMessages: Record<string, string> = {
  "supabase-not-configured":
    "Social sign-in is not configured yet. Add Supabase URL and anon key to .env.local, restart the dev server, and enable this provider in Supabase.",
  "invalid-provider": "That social provider is not supported.",
  "oauth-start-failed":
    "The social sign-in flow could not start. Check the provider settings in Supabase.",
};

function OAuthButtons({
  redirectTo,
  authPage,
}: {
  redirectTo: string;
  authPage: "login" | "register";
}) {
  return (
    <div className="grid gap-3">
      {(["google", "facebook", "apple"] as const).map((provider) => (
        <form key={provider} action={signInWithOAuth}>
          <input type="hidden" name="provider" value={provider} />
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <input type="hidden" name="authPage" value={authPage} />
          <button
            type="submit"
            className="w-full rounded-md border border-white/15 px-5 py-3 font-bold capitalize text-neutral-100 transition hover:border-orange-300 hover:text-orange-200"
          >
            Continue with {provider}
          </button>
        </form>
      ))}
    </div>
  );
}

export function LoginForm({
  redirectTo,
  error,
}: {
  redirectTo: string;
  error?: string;
}) {
  const [state, formAction] = useActionState(signInWithEmailOrUsername, {});

  return (
    <div className="mx-auto w-full max-w-md rounded-lg border border-white/10 bg-neutral-900 p-6 shadow-lg shadow-black/25">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-orange-300">
          Account
        </p>
        <h1 className="mt-2 text-3xl font-black text-white">Log in</h1>
        <p className="mt-3 text-sm leading-6 text-neutral-400">
          Use your email, username, or a connected social account.
        </p>
      </div>

      {error ? (
        <p className="mb-4 rounded-md border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">
          {authErrorMessages[error] ?? "Login could not start. Check your Supabase configuration."}
        </p>
      ) : null}

      <form action={formAction} className="grid gap-4">
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <label className="grid gap-2 text-sm font-semibold text-neutral-200">
          Email or username
          <input
            name="identifier"
            required
            className="rounded-md border border-white/10 bg-neutral-950 px-4 py-3 text-white outline-none focus:border-orange-300"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-neutral-200">
          Password
          <input
            name="password"
            type="password"
            required
            className="rounded-md border border-white/10 bg-neutral-950 px-4 py-3 text-white outline-none focus:border-orange-300"
          />
        </label>
        <ActionError state={state} />
        <SubmitButton label="Log in" />
      </form>

      <div className="my-6 h-px bg-white/10" />
      <OAuthButtons redirectTo={redirectTo} authPage="login" />

      <p className="mt-6 text-center text-sm text-neutral-400">
        Need an account?{" "}
        <Link href="/register" className="font-bold text-orange-300 hover:text-orange-200">
          Register
        </Link>
      </p>
    </div>
  );
}

export function RegisterForm({
  redirectTo,
  error,
}: {
  redirectTo: string;
  error?: string;
}) {
  const [state, formAction] = useActionState(registerUser, {});

  return (
    <div className="mx-auto w-full max-w-md rounded-lg border border-white/10 bg-neutral-900 p-6 shadow-lg shadow-black/25">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-orange-300">
          New runner
        </p>
        <h1 className="mt-2 text-3xl font-black text-white">Create account</h1>
        <p className="mt-3 text-sm leading-6 text-neutral-400">
          Save favorites, check order status, and manage your profile.
        </p>
      </div>

      {error ? (
        <p className="mb-4 rounded-md border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">
          {authErrorMessages[error] ??
            "Registration could not start. Check your Supabase configuration."}
        </p>
      ) : null}

      <form action={formAction} className="grid gap-4">
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <label className="grid gap-2 text-sm font-semibold text-neutral-200">
          Display name
          <input
            name="displayName"
            className="rounded-md border border-white/10 bg-neutral-950 px-4 py-3 text-white outline-none focus:border-orange-300"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-neutral-200">
          Username
          <input
            name="username"
            required
            minLength={3}
            className="rounded-md border border-white/10 bg-neutral-950 px-4 py-3 text-white outline-none focus:border-orange-300"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-neutral-200">
          Email
          <input
            name="email"
            type="email"
            required
            className="rounded-md border border-white/10 bg-neutral-950 px-4 py-3 text-white outline-none focus:border-orange-300"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-neutral-200">
          Password
          <input
            name="password"
            type="password"
            required
            minLength={8}
            pattern="(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}"
            title="Use at least 8 characters, one uppercase letter, one number, and one special character."
            className="rounded-md border border-white/10 bg-neutral-950 px-4 py-3 text-white outline-none focus:border-orange-300"
          />
        </label>
        <p className="-mt-2 text-xs leading-5 text-neutral-400">
          Use at least 8 characters with one uppercase letter, one number, and one
          special character.
        </p>
        <ActionError state={state} />
        <SubmitButton label="Create account" />
      </form>

      <div className="my-6 h-px bg-white/10" />
      <OAuthButtons redirectTo={redirectTo} authPage="register" />

      <p className="mt-6 text-center text-sm text-neutral-400">
        Already registered?{" "}
        <Link href="/login" className="font-bold text-orange-300 hover:text-orange-200">
          Log in
        </Link>
      </p>
    </div>
  );
}
