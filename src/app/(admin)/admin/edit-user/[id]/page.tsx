import { getUserById, updateUser } from "@/lib/actions/admin";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUserById(id);

  if (!user) {
    return (
      <div className="text-center">
        <p className="text-zinc-500">Usuario no encontrado</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Editar Usuario</h1>
        <p className="text-zinc-500">Modificar datos de {user.full_name || user.email}</p>
      </div>

      <form
        action={async (formData) => {
          "use server";
          await updateUser(user.id, formData);
        }}
        className="space-y-6 rounded-xl border border-zinc-200 bg-white p-6"
      >
        <div>
          <label htmlFor="full_name" className="block text-sm font-medium text-zinc-700">
            Nombre completo
          </label>
          <input
            type="text"
            id="full_name"
            name="full_name"
            defaultValue={user.full_name || ""}
            required
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-zinc-700">
            Rol
          </label>
          <select
            id="role"
            name="role"
            defaultValue={user.role}
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="barber">Barbero</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="barber_share_pct" className="block text-sm font-medium text-zinc-700">
              % Barbero
            </label>
            <input
              type="number"
              id="barber_share_pct"
              name="barber_share_pct"
              min="0"
              max="100"
              defaultValue={user.barber_share_pct}
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <div>
            <label htmlFor="shop_share_pct" className="block text-sm font-medium text-zinc-700">
              % Local
            </label>
            <input
              type="number"
              id="shop_share_pct"
              name="shop_share_pct"
              min="0"
              max="100"
              defaultValue={user.shop_share_pct}
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_active"
            name="is_active"
            defaultChecked={user.is_active}
            className="h-4 w-4 rounded border-zinc-300 text-amber-500 focus:ring-amber-500"
          />
          <label htmlFor="is_active" className="text-sm text-zinc-700">
            Usuario activo
          </label>
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600"
        >
          Guardar Cambios
        </button>
      </form>
    </div>
  );
}
