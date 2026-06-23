import { redirect } from "next/navigation";
import { RoleAssignmentForm } from "@/components/admin-forms";
import { getAdminSessionContext, getAdminUsers } from "@/lib/data";

const roleNames = {
  customer: "Customer",
  catalog_editor: "Catalog editor",
  admin: "Admin",
};

export default async function AdminUsersPage() {
  const session = await getAdminSessionContext();

  if (!session.canManageUsers) {
    redirect("/admin/catalog");
  }

  const users = await getAdminUsers();

  return (
    <section className="grid gap-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-orange-300">
          Admin
        </p>
        <h1 className="mt-2 text-3xl font-black text-white">User permissions</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-400">
          Assign catalog authoring access to trusted users. Admins can manage users and products;
          catalog editors can manage products only.
        </p>
      </div>

      {!users.length ? (
        <div className="rounded-lg border border-white/10 bg-neutral-900 p-6">
          <p className="text-neutral-300">No users are visible to this admin session.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {users.map((profile) => (
            <article
              key={profile.id}
              className="grid gap-4 rounded-lg border border-white/10 bg-neutral-900 p-5 lg:grid-cols-[1fr_360px]"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="truncate text-xl font-black text-white">
                    {profile.displayName || profile.username}
                  </h2>
                  <span className="rounded-full bg-orange-500/15 px-3 py-1 text-sm font-bold text-orange-200">
                    {roleNames[profile.role]}
                  </span>
                </div>
                <p className="mt-2 truncate text-sm text-neutral-300">{profile.email}</p>
                <p className="mt-1 text-sm text-neutral-500">@{profile.username}</p>
              </div>
              <RoleAssignmentForm profile={profile} currentUserId={session.userId} />
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
