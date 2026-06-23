import Link from "next/link";
import { ProfileForm } from "@/components/profile-form";
import { getSessionContext } from "@/lib/data";

export default async function AccountPage() {
  const session = await getSessionContext();

  if (!session.profile) {
    return (
      <section className="rounded-lg border border-white/10 bg-neutral-900 p-6">
        <h1 className="text-3xl font-black text-white">Account setup required</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-300">
          Configure Supabase and run the database migration to create profile storage.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex rounded-md bg-orange-500 px-5 py-3 font-bold text-neutral-950 hover:bg-orange-400"
        >
          Back to store
        </Link>
      </section>
    );
  }

  return (
    <section className="grid gap-6">
      <ProfileForm profile={session.profile} />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-white/10 bg-neutral-900 p-5">
          <p className="text-sm text-neutral-400">Email</p>
          <p className="mt-2 truncate font-bold text-white">{session.profile.email}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-neutral-900 p-5">
          <p className="text-sm text-neutral-400">Username</p>
          <p className="mt-2 font-bold text-white">@{session.profile.username}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-neutral-900 p-5">
          <p className="text-sm text-neutral-400">Saved favorites</p>
          <p className="mt-2 font-bold text-white">{session.favoriteIds.length}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-neutral-900 p-5">
          <p className="text-sm text-neutral-400">Role</p>
          <p className="mt-2 font-bold capitalize text-white">
            {session.profile.role.replace("_", " ")}
          </p>
        </div>
      </div>
    </section>
  );
}
