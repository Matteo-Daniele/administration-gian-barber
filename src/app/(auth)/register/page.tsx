"use client";

import { useState, Suspense } from "react";
import { register } from "@/lib/actions/auth";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function RegisterForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [loading, setLoading] = useState(false);

  return (
    <>
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <form
        action={async (formData) => {
          setLoading(true);
          await register(formData);
        }}
        className="space-y-4"
      >
        <div>
          <label htmlFor="full_name" className="mb-1 block text-sm font-medium text-zinc-700">
            Nombre completo
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            required
            className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-zinc-900 outline-none transition-colors focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            placeholder="Juan Perez"
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-zinc-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-zinc-900 outline-none transition-colors focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            placeholder="tu@email.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-zinc-700">
            Contrasena
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-zinc-900 outline-none transition-colors focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            placeholder="Minimo 6 caracteres"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-amber-500 py-3 text-lg font-semibold text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
        >
          {loading ? "Creando cuenta..." : "Crear Cuenta"}
        </button>
      </form>
    </>
  );
}

export default function RegisterPage() {
  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-zinc-900">Gian Barber</h1>
        <p className="mt-2 text-sm text-zinc-500">Crea tu cuenta</p>
      </div>

      <Suspense fallback={<div className="text-center text-zinc-400">Cargando...</div>}>
        <RegisterForm />
      </Suspense>

      <p className="mt-6 text-center text-sm text-zinc-500">
        Ya tenes cuenta?{" "}
        <Link href="/login" className="font-medium text-amber-600 hover:text-amber-700">
          Inicia sesion
        </Link>
      </p>
    </div>
  );
}
