import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-3xl font-semibold">Next.js + PocketBase</h1>
      <p className="max-w-md text-zinc-600">
        Exemplo simples de autenticação e CRUD usando Next.js no front-end e
        PocketBase como back-end.
      </p>

      <div className="flex gap-4">
        <Link href="/login" className="bg-black text-white rounded px-5 py-2 font-medium">
          Entrar
        </Link>
        <Link href="/register" className="border rounded px-5 py-2 font-medium">
          Criar conta
        </Link>
      </div>
    </main>
  );
}
