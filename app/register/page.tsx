import { RegisterForm } from "@/components/auth-forms";
import { SetupNotice } from "@/components/setup-notice";
import { SiteHeader } from "@/components/site-header";
import { getSessionContext } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type RegisterPageProps = {
  searchParams: Promise<{
    redirectTo?: string;
    error?: string;
  }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const [{ redirectTo = "/account", error }, session] = await Promise.all([
    searchParams,
    getSessionContext(),
  ]);

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      {!isSupabaseConfigured ? <SetupNotice /> : null}
      <SiteHeader profile={session.profile} email={session.email} />
      <section className="px-5 py-12 sm:px-8">
        <RegisterForm redirectTo={redirectTo} error={error} />
      </section>
    </main>
  );
}
