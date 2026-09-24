# Guia: criando este projeto do zero

Este guia mostra **todos os comandos**, na ordem certa, para recriar este projeto do início — como se você estivesse começando em uma pasta vazia. É um complemento didático ao [README.md](README.md) (que assume que o projeto já existe e foca em como rodá-lo).

Ao final, você terá: um projeto Next.js criado com `create-next-app`, o SDK do PocketBase instalado, as páginas de cadastro/login/CRUD, e a coleção `posts` criada no PocketBase — tanto pelo painel visual quanto via linha de comando.

## Pré-requisitos

| Ferramenta | Versão usada neste guia | Link |
|---|---|---|
| Node.js | 24.x (qualquer 18.18+ funciona) | https://nodejs.org |
| pnpm | 11.x (qualquer 9+ funciona) | https://pnpm.io/installation |
| PocketBase | 0.28+ | https://pocketbase.io/docs/ |

Instale o pnpm, se ainda não tiver:

```bash
npm install -g pnpm
```

---

## Parte 1 — Criar o projeto Next.js

### 1.1. Rodar o `create-next-app`

```bash
pnpm create next-app my-app
```

Durante a criação, o CLI faz várias perguntas. Use estas respostas (foi exatamente assim que este projeto foi gerado):

```
✔ Would you like to use TypeScript?           › Yes
✔ Which linter would you like to use?         › ESLint
✔ Would you like to use Tailwind CSS?         › Yes
✔ Would you like your code inside a `src/` directory? › No
✔ Would you like to use App Router?           › Yes
✔ Would you like to use Turbopack?            › Yes
✔ Would you like to customize the import alias (`@/*` by default)? › No
```

Isso gera a estrutura básica:

```
my-app/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   └── favicon.ico
├── public/
├── next.config.ts
├── tsconfig.json
├── package.json
├── postcss.config.mjs
└── eslint.config.mjs
```

### 1.2. Entrar na pasta e testar

```bash
cd my-app
pnpm dev
```

Acesse http://localhost:3000 — você deve ver a página padrão do Next.js ("To get started, edit the page.tsx file"). Pare o servidor com `Ctrl+C` depois de confirmar.

### 1.3. Inicializar o git (se ainda não for um repositório)

```bash
git init
git add -A
git commit -m "Initial commit from Create Next App"
```

---

## Parte 2 — Instalar o SDK do PocketBase

O front-end conversa com o PocketBase através do SDK oficial em JavaScript, que já faz toda a parte de autenticação (guardar token, renovar sessão) e CRUD via REST.

```bash
pnpm add pocketbase
```

Isso adiciona a dependência `pocketbase` ao `package.json`. Não é necessário instalar nenhuma outra biblioteca — o restante do projeto usa apenas o que já vem do `create-next-app` (React, Next.js, Tailwind).

> Não confunda: o **SDK** (`pocketbase` do npm) é só um cliente HTTP. O **servidor** PocketBase é baixado separadamente como executável (Parte 3).

---

## Parte 3 — Baixar e rodar o servidor PocketBase

### 3.1. Baixar

Baixe o binário do PocketBase para o seu sistema operacional em https://pocketbase.io/docs/ (seção "Download"). Extraia em uma pasta, por exemplo `pocketbase/` dentro do projeto.

Adicione essa pasta ao `.gitignore` (o binário não deve ser versionado):

```
# pocketbase
/pocketbase/pocketbase
/pocketbase/pocketbase.exe
/pocketbase/pb_data/
```

### 3.2. Rodar

**Windows:**
```powershell
cd pocketbase
./pocketbase.exe serve
```

**Linux/macOS:**
```bash
cd pocketbase
./pocketbase serve
```

Saída esperada:

```
Server started at http://127.0.0.1:8090
├─ REST API:  http://127.0.0.1:8090/api/
└─ Dashboard: http://127.0.0.1:8090/_/
```

Deixe esse terminal aberto.

### 3.3. Criar o superusuário (admin)

Acesse http://127.0.0.1:8090/_/ no navegador pela primeira vez — o PocketBase vai pedir para criar uma conta de administrador (email + senha). Essa conta é usada só para gerenciar o banco (criar coleções, ver dados), não é a mesma coisa que os usuários finais do app.

---

## Parte 4 — Criar o cliente PocketBase no projeto

Crie o arquivo `lib/pocketbase.ts`:

```bash
mkdir lib
```

```ts
// lib/pocketbase.ts
import PocketBase from "pocketbase";

export const pb = new PocketBase("http://127.0.0.1:8090");
```

Esse arquivo cria **uma única instância** do cliente PocketBase, reaproveitada em toda a aplicação (importando `{ pb }` de `@/lib/pocketbase`). Isso é importante porque o SDK guarda o estado de autenticação (token) dentro dessa instância — se você criar várias instâncias, cada uma teria sua própria sessão.

---

## Parte 5 — Criar a coleção `posts` no PocketBase

Você pode criar a coleção de duas formas: pelo painel visual (mais fácil para iniciantes) ou via API/curl (mais rápido, reproduzível em script).

### Opção A — Pelo painel admin (recomendado para aprender)

1. Acesse http://127.0.0.1:8090/_/
2. **Collections** → **New collection**
3. Nome: `posts`, tipo **Base**
4. Adicione os campos:

   | Campo | Tipo | Obrigatório | Configuração extra |
   |---|---|---|---|
   | `title` | Text | ✅ | — |
   | `content` | Text | ✅ | — |
   | `user` | Relation | ✅ | Coleção relacionada: `users`, Max select: 1 |
   | `created` | Autodate | — | "On create" ativado |
   | `updated` | Autodate | — | "On create" e "On update" ativados |

5. Aba **API Rules** — defina as 4 regras para que cada usuário só acesse os próprios posts:

   | Regra | Valor |
   |---|---|
   | List/Search | `user = @request.auth.id` |
   | View | `user = @request.auth.id` |
   | Create | `@request.auth.id != ""` |
   | Update | `user = @request.auth.id` |
   | Delete | `user = @request.auth.id` |

6. Salvar.

### Opção B — Via API (curl), sem abrir o navegador

Essa é a forma programática — útil para automatizar em um script de setup. Substitua `SEU_EMAIL` e `SUA_SENHA` pelo superusuário criado no passo 3.3.

**1. Autenticar como superusuário e guardar o token:**

```bash
TOKEN=$(curl -s -X POST http://127.0.0.1:8090/api/collections/_superusers/auth-with-password \
  -H "Content-Type: application/json" \
  -d '{"identity":"SEU_EMAIL","password":"SUA_SENHA"}' \
  | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).token))")
```

**2. Criar a coleção `posts` com campos e regras já configurados:**

```bash
curl -s -X POST http://127.0.0.1:8090/api/collections \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "posts",
    "type": "base",
    "fields": [
      { "name": "title", "type": "text", "required": true },
      { "name": "content", "type": "text", "required": true },
      { "name": "user", "type": "relation", "required": true, "collectionId": "_pb_users_auth_", "maxSelect": 1 },
      { "name": "created", "type": "autodate", "onCreate": true, "onUpdate": false },
      { "name": "updated", "type": "autodate", "onCreate": true, "onUpdate": true }
    ],
    "listRule": "user = @request.auth.id",
    "viewRule": "user = @request.auth.id",
    "createRule": "@request.auth.id != \"\"",
    "updateRule": "user = @request.auth.id",
    "deleteRule": "user = @request.auth.id"
  }'
```

Se der certo, a resposta é um JSON com o `id` da nova coleção (algo como `pbc_xxxxxxxxxx`).

> `_pb_users_auth_` é o ID fixo da coleção `users` padrão do PocketBase — não precisa descobrir esse valor, ele é sempre esse.

**3. Conferir que a coleção foi criada:**

```bash
curl -s http://127.0.0.1:8090/api/collections/posts -H "Authorization: $TOKEN"
```

### Opção C — Via MCP (assistente de IA)

Se você usa o Claude Code (ou outro cliente MCP), este repositório já inclui um [.mcp.json](.mcp.json) configurando o servidor `dynamic-pocketbase-mcp`. Com ele conectado, basta pedir para o assistente autenticar como admin e criar a coleção — sem digitar curl nem abrir o painel. Veja a seção "MCP do PocketBase" no [README.md](README.md).

---

## Parte 6 — Criar as páginas do Next.js

Com o SDK instalado e a coleção `posts` pronta, falta só o front-end. Estrutura final:

```
app/
├── page.tsx           → home, com links para /login e /register
├── login/
│   └── page.tsx         → formulário de login
├── register/
│   └── page.tsx          → formulário de cadastro
└── posts/
    └── page.tsx           → CRUD protegido
```

Crie as pastas:

```bash
mkdir -p app/login app/register app/posts
```

O conteúdo de cada `page.tsx` já está pronto neste repositório — copie diretamente de:

- [app/login/page.tsx](app/login/page.tsx)
- [app/register/page.tsx](app/register/page.tsx)
- [app/posts/page.tsx](app/posts/page.tsx)

Pontos-chave de cada arquivo, para quem quer entender/recriar na mão:

- Todas as páginas começam com `"use client"` — são componentes client-side porque usam `useState`, `useEffect` e interações do usuário (formulários, cliques). Ver [Server e Client Components](node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md) na documentação do Next.js.
- `register/page.tsx` usa `pb.collection("users").create(...)` seguido de `authWithPassword(...)`, para já logar o usuário automaticamente após o cadastro.
- `login/page.tsx` usa `pb.collection("users").authWithPassword(email, password)`.
- `posts/page.tsx` verifica `pb.authStore.isValid` dentro de um `useEffect` para proteger a rota, e implementa as 4 operações de CRUD chamando `pb.collection("posts")`.

---

## Parte 7 — Rodar tudo junto

Com o PocketBase rodando (Parte 3) em um terminal, abra outro terminal na raiz do projeto Next.js:

```bash
pnpm dev
```

Acesse http://localhost:3000/register, crie uma conta e teste o CRUD em `/posts`.

---

## Checklist final

- [ ] `pnpm create next-app` rodado com TypeScript + Tailwind + App Router
- [ ] `pnpm add pocketbase` executado
- [ ] PocketBase baixado e rodando (`pocketbase serve`)
- [ ] Superusuário criado no painel admin
- [ ] `lib/pocketbase.ts` criado, apontando para `http://127.0.0.1:8090`
- [ ] Coleção `posts` criada com os campos `title`, `content`, `user`, `created`, `updated`
- [ ] API Rules da coleção `posts` configuradas (list/view/create/update/delete = dono do post)
- [ ] Páginas `app/login`, `app/register`, `app/posts` criadas
- [ ] `pnpm dev` rodando e app acessível em http://localhost:3000

Para instruções de uso do dia a dia (depois que tudo já está criado), consulte o [README.md](README.md).
