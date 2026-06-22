import { LoginForm } from "@/components/auth-forms";
import { SetupNotice } from "@/components/setup-notice";
import { SiteHeader } from "@/components/site-header";
import { getSessionContext } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type LoginPageProps = {
  searchParams: Promise<{
    redirectTo?: string;
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [{ redirectTo = "/account", error }, session] = await Promise.all([
    searchParams,
    getSessionContext(),
  ]);

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      {!isSupabaseConfigured ? <SetupNotice /> : null}
      <SiteHeader profile={session.profile} email={session.email} />
      <section className="px-5 py-12 sm:px-8">
        <LoginForm redirectTo={redirectTo} error={error} />
      </section>
    </main>
  );
}
