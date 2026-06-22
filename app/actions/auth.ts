"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type AuthActionState = {
  error?: string;
};

const cleanUsername = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "");

const passwordError = (password: string) => {
  if (password.length < 8) {
    return "Password must be at least 8 characters.";
  }

  if (!/[A-Z]/.test(password)) {
    return "Password must include at least one uppercase letter.";
  }

  if (!/[0-9]/.test(password)) {
    return "Password must include at least one number.";
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Password must include at least one special character.";
  }

  return null;
};

const getRedirectPath = (formData: FormData) => {
  const redirectTo = formData.get("redirectTo")?.toString();
  return redirectTo?.startsWith("/") ? redirectTo : "/account";
};

const getAuthPage = (formData: FormData) => {
  const authPage = formData.get("authPage")?.toString();
  return authPage === "register" ? "/register" : "/login";
};

export async function registerUser(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!isSupabaseConfigured) {
    return { error: "Supabase environment variables are not configured." };
  }

  const email = formData.get("email")?.toString().trim().toLowerCase();
  const password = formData.get("password")?.toString();
  const username = cleanUsername(formData.get("username")?.toString() ?? "");
  const displayName = formData.get("displayName")?.toString().trim() || username;

  if (!email || !password || !username) {
    return { error: "Email, username, and password are required." };
  }

  if (username.length < 3) {
    return { error: "Username must be at least 3 characters." };
  }

  const validationError = passwordError(password);

  if (validationError) {
    return { error: validationError };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        display_name: displayName,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  redirect(getRedirectPath(formData));
}

export async function signInWithEmailOrUsername(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!isSupabaseConfigured) {
    return { error: "Supabase environment variables are not configured." };
  }

  const identifier = formData.get("identifier")?.toString().trim().toLowerCase();
  const password = formData.get("password")?.toString();

  if (!identifier || !password) {
    return { error: "Email or username and password are required." };
  }

  const supabase = await createClient();
  let email = identifier;

  if (!identifier.includes("@")) {
    const { data, error } = await supabase.rpc("get_email_for_username", {
      lookup_username: cleanUsername(identifier),
    });

    if (error || !data) {
      return { error: "No account was found for that username." };
    }

    email = data as string;
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect(getRedirectPath(formData));
}

export async function signInWithOAuth(formData: FormData) {
  const authPage = getAuthPage(formData);

  if (!isSupabaseConfigured) {
    redirect(`${authPage}?error=supabase-not-configured`);
  }

  const provider = formData.get("provider")?.toString();
  const redirectPath = getRedirectPath(formData);

  if (!provider || !["google", "facebook", "apple"].includes(provider)) {
    redirect(`${authPage}?error=invalid-provider`);
  }

  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin") ?? "http://localhost:3000";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider as "google" | "facebook" | "apple",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(redirectPath)}`,
    },
  });

  if (error || !data.url) {
    redirect(`${authPage}?error=oauth-start-failed`);
  }

  redirect(data.url);
}

export async function signOut() {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  redirect("/");
}
