import { getUserById } from "@/lib/actions/admin";
import EditUserForm from "@/components/EditUserForm";
import { redirect } from "next/navigation";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUserById(id);

  if (!user) {
    redirect("/admin/users");
  }

  return <EditUserForm user={user} />;
}
