import { redirect } from "next/navigation";
import { getAdminSessionContext } from "@/lib/data";

export default async function AdminPage() {
  const session = await getAdminSessionContext();

  if (session.canManageUsers) {
    redirect("/admin/users");
  }

  redirect("/admin/catalog");
}
