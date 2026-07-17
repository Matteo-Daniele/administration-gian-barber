import { createUser } from "@/lib/actions/admin";

export default function CreateUserPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Crear Usuario</h1>
        <p className="text-zinc-500">Crea un nuevo usuario en el sistema</p>
      </div>

      <form action={createUser} className="space-y-6 rounded-xl border border-zinc-200 bg-white p-6">
        <div>
          <label htmlFor="full_name" className="block text-sm font-medium text-zinc-700">
            Nombre completo
          </label>
          <input
            type="text"
            id="full_name"
            name="full_name"
            required
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-zinc-700">
            Contraseña
          </label>
          <input
            type="password"
            id="password"
            name="password"
            required
            minLength={6}
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
              defaultValue={50}
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
              defaultValue={50}
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600"
        >
          Crear Usuario
        </button>
      </form>
    </div>
  );
}
