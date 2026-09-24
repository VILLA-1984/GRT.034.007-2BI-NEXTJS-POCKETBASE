This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Exemplo: Autenticação + CRUD com PocketBase

Este projeto tem um exemplo simples de:

- **Cadastro** de usuário (`/register`)
- **Login** (`/login`)
- **CRUD de posts** (`/posts`), protegido — só acessível logado

Todo o código fica em [app/login/page.tsx](app/login/page.tsx), [app/register/page.tsx](app/register/page.tsx), [app/posts/page.tsx](app/posts/page.tsx) e o cliente do PocketBase em [lib/pocketbase.ts](lib/pocketbase.ts).

### 1. Rodar o PocketBase

Baixe o PocketBase em https://pocketbase.io/docs/ e rode:

```bash
./pocketbase serve
```

Isso abre o painel admin em http://127.0.0.1:8090/_/ e a API em http://127.0.0.1:8090/api/.

A coleção `users` já vem pronta por padrão (autenticação).

### 2. Criar a coleção `posts`

No painel admin (http://127.0.0.1:8090/_/), crie uma nova coleção chamada `posts` com os campos:

| Campo   | Tipo     | Observação                          |
|---------|----------|--------------------------------------|
| title   | Text     | obrigatório                          |
| content | Text     | obrigatório                          |
| user    | Relation | relaciona com a coleção `users`, obrigatório |

Depois, na aba **API Rules** da coleção `posts`, defina as regras para que cada usuário só veja/edite os próprios posts:

- **List/Search**: `user = @request.auth.id`
- **View**: `user = @request.auth.id`
- **Create**: `@request.auth.id != ""`
- **Update**: `user = @request.auth.id`
- **Delete**: `user = @request.auth.id`

### 3. Rodar o Next.js

```bash
pnpm dev
```

Acesse http://localhost:3000, crie uma conta em `/register` e teste o CRUD em `/posts`.

> O endereço do PocketBase está fixo em `lib/pocketbase.ts` (`http://127.0.0.1:8090`). Se rodar em outra porta/host, atualize esse arquivo.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
