"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { pb } from "@/lib/pocketbase";

type Post = {
  id: string;
  title: string;
  content: string;
};

export default function PostsPage() {
  const router = useRouter();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // campos do formulário (usados tanto para criar quanto para editar)
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  // 1. Proteção da rota: se não estiver logado, manda para /login
  useEffect(() => {
    if (!pb.authStore.isValid) {
      router.push("/login");
      return;
    }
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. READ - carrega a lista de posts do usuário logado
  async function loadPosts() {
    setLoading(true);
    setError("");
    try {
      const result = await pb.collection("posts").getFullList<Post>({
        sort: "-created",
        filter: `user = "${pb.authStore.record?.id}"`,
        requestKey: null, // evita erro de "autocancelled" quando o efeito roda 2x (StrictMode)
      });
      setPosts(result);
    } catch (err) {
      console.error(err);
      setError("Erro ao carregar os posts.");
    } finally {
      setLoading(false);
    }
  }

  // 3. CREATE / UPDATE - o mesmo formulário serve para os dois casos
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      if (editingId) {
        // UPDATE
        await pb.collection("posts").update(editingId, { title, content });
      } else {
        // CREATE
        await pb.collection("posts").create({
          title,
          content,
          user: pb.authStore.record?.id,
        });
      }

      resetForm();
      await loadPosts();
    } catch (err) {
      console.error(err);
      setError("Erro ao salvar o post.");
    }
  }

  // 4. DELETE
  async function handleDelete(id: string) {
    const confirmed = window.confirm("Tem certeza que deseja excluir este post?");
    if (!confirmed) return;

    try {
      await pb.collection("posts").delete(id);
      await loadPosts();
    } catch (err) {
      console.error(err);
      setError("Erro ao excluir o post.");
    }
  }

  function startEdit(post: Post) {
    setEditingId(post.id);
    setTitle(post.title);
    setContent(post.content);
  }

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setContent("");
  }

  function handleLogout() {
    pb.authStore.clear();
    router.push("/login");
  }

  if (loading) {
    return <main className="p-8">Carregando...</main>;
  }

  return (
    <main className="flex-1 max-w-2xl mx-auto w-full p-8 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Meus posts</h1>
        <button onClick={handleLogout} className="text-sm underline">
          Sair
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
          {error}
        </p>
      )}

      {/* Formulário de criar/editar */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 border rounded-lg p-4">
        <h2 className="font-medium">{editingId ? "Editar post" : "Novo post"}</h2>

        <input
          type="text"
          required
          placeholder="Título"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border rounded px-3 py-2"
        />

        <textarea
          required
          placeholder="Conteúdo"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="border rounded px-3 py-2"
          rows={3}
        />

        <div className="flex gap-2">
          <button type="submit" className="bg-black text-white rounded px-4 py-2 font-medium">
            {editingId ? "Salvar alterações" : "Criar post"}
          </button>

          {editingId && (
            <button type="button" onClick={resetForm} className="rounded px-4 py-2 border">
              Cancelar
            </button>
          )}
        </div>
      </form>

      {/* Lista de posts */}
      <ul className="flex flex-col gap-3">
        {posts.length === 0 && (
          <li className="text-sm text-zinc-500">Você ainda não tem nenhum post.</li>
        )}

        {posts.map((post) => (
          <li key={post.id} className="border rounded-lg p-4 flex flex-col gap-2">
            <h3 className="font-medium">{post.title}</h3>
            <p className="text-sm text-zinc-600 whitespace-pre-wrap">{post.content}</p>

            <div className="flex gap-3 text-sm">
              <button onClick={() => startEdit(post)} className="underline">
                Editar
              </button>
              <button onClick={() => handleDelete(post.id)} className="underline text-red-600">
                Excluir
              </button>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
