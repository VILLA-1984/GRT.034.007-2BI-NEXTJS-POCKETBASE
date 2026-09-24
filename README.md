# Next.js + PocketBase — Exemplo de Autenticação e CRUD

Projeto de exemplo, feito para fins didáticos, mostrando como construir uma aplicação web simples com:

- **Next.js** (App Router) no front-end
- **PocketBase** como back-end (banco de dados + autenticação + API REST), rodando localmente

O objetivo é ser o mais simples e direto possível, para quem está começando no desenvolvimento front-end.

## O que a aplicação faz

- `/register` — cria uma conta de usuário
- `/login` — faz login com email e senha
- `/posts` — página protegida (só acessível logado) com um CRUD completo: criar, listar, editar e excluir "posts"

Cada usuário só vê e edita os próprios posts.

## Pré-requisitos

Antes de começar, você precisa ter instalado:

| Ferramenta | Versão mínima | Link |
|---|---|---|
| Node.js | 18.18+ (recomendado 20+) | https://nodejs.org |
| pnpm | 9+ | https://pnpm.io/installation |
| PocketBase | 0.28+ | https://pocketbase.io/docs/ |

Este projeto usa **pnpm** como gerenciador de pacotes (existe um `pnpm-lock.yaml` no repositório). Se você não tem o pnpm instalado:

```bash
npm install -g pnpm
```

## 1. Clonar o repositório

```bash
git clone https://github.com/VILLA-1984/GRT.034.007-2BI-NEXTJS-POCKETBASE.git
cd GRT.034.007-2BI-NEXTJS-POCKETBASE
```

## 2. Instalar as dependências do Next.js

```bash
pnpm install
```

## 3. Baixar e rodar o PocketBase

O PocketBase é um único executável — não precisa instalar nada além de baixar o arquivo.

1. Baixe o binário para o seu sistema operacional em https://pocketbase.io/docs/ (seção "Download").
2. Extraia o arquivo `pocketbase` (ou `pocketbase.exe` no Windows) em uma pasta, por exemplo `pocketbase/` na raiz do projeto (essa pasta **não** deve ser commitada — veja a seção sobre `.gitignore` mais abaixo).
3. Rode o servidor:

**Windows (PowerShell ou cmd):**
```powershell
./pocketbase.exe serve
```

**Linux / macOS:**
```bash
./pocketbase serve
```

Se tudo der certo, você verá algo como:

```
Server started at http://127.0.0.1:8090
├─ REST API:  http://127.0.0.1:8090/api/
└─ Dashboard: http://127.0.0.1:8090/_/
```

Deixe esse terminal aberto — o PocketBase precisa continuar rodando enquanto você usa o app.

### 3.1. Criar o usuário administrador (superuser)

Na primeira vez que você acessar http://127.0.0.1:8090/_/ no navegador, o PocketBase vai pedir para você criar uma conta de administrador (email + senha). Essa conta é **diferente** dos usuários que se cadastram pelo app (`/register`) — ela é só para gerenciar o banco pelo painel admin.

> Guarde esse email/senha, você vai precisar deles para configurar as coleções.

### 3.2. A coleção `users`

O PocketBase já cria automaticamente uma coleção chamada `users`, pronta para autenticação (cadastro/login). Você não precisa mexer nela para este exemplo funcionar.

### 3.3. Criar a coleção `posts`

Essa é a única configuração manual necessária. No painel admin (http://127.0.0.1:8090/_/):

1. Vá em **Collections** → **New collection**.
2. Nome: `posts`. Tipo: **Base**.
3. Adicione os campos:

   | Campo | Tipo | Obrigatório | Observação |
   |---|---|---|---|
   | `title` | Text | ✅ | título do post |
   | `content` | Text | ✅ | conteúdo do post |
   | `user` | Relation | ✅ | relaciona com a coleção `users`, "Max select" = 1 |

4. Ainda na criação/edição da coleção, adicione também os campos automáticos de data (opcional, mas usado pelo app para ordenar por mais recente):

   | Campo | Tipo | Configuração |
   |---|---|---|
   | `created` | Autodate | "On create" ativado |
   | `updated` | Autodate | "On create" e "On update" ativados |

5. Vá na aba **API Rules** dessa mesma coleção e configure para que cada usuário só acesse os próprios posts:

   | Regra | Valor |
   |---|---|
   | List/Search | `user = @request.auth.id` |
   | View | `user = @request.auth.id` |
   | Create | `@request.auth.id != ""` |
   | Update | `user = @request.auth.id` |
   | Delete | `user = @request.auth.id` |

6. Salve a coleção.

Pronto — o back-end está configurado.

## 4. Rodar o Next.js

Em outro terminal (deixando o PocketBase rodando no primeiro):

```bash
pnpm dev
```

Acesse http://localhost:3000.

Fluxo de teste sugerido:

1. Abra http://localhost:3000/register e crie uma conta (email + senha, mínimo 8 caracteres).
2. Você será redirecionado automaticamente para `/posts`.
3. Crie, edite e exclua alguns posts.
4. Clique em "Sair" para deslogar, depois entre de novo em `/login`.

## Estrutura do projeto

```
app/
├── page.tsx           → página inicial, com links para login/cadastro
├── login/page.tsx      → formulário de login
├── register/page.tsx   → formulário de cadastro
├── posts/page.tsx       → CRUD de posts (rota protegida)
└── layout.tsx           → layout raiz (fontes, html/body)

lib/
└── pocketbase.ts         → instância única do cliente PocketBase, usada em toda a aplicação
```

### Como a autenticação funciona

O SDK do PocketBase (`pocketbase` no npm) mantém a sessão do usuário automaticamente no `localStorage` do navegador, através do objeto `pb.authStore`:

- `pb.collection("users").create(...)` — cria um novo usuário
- `pb.collection("users").authWithPassword(email, senha)` — faz login e guarda o token
- `pb.authStore.isValid` — `true` se o usuário está logado
- `pb.authStore.record` — dados do usuário logado (ex: `pb.authStore.record.id`)
- `pb.authStore.clear()` — faz logout

A página `/posts` verifica `pb.authStore.isValid` assim que carrega; se não estiver logado, redireciona para `/login`.

### Como o CRUD funciona

Tudo acontece direto no navegador, através do SDK do PocketBase, sem precisar escrever nenhuma rota de API no Next.js:

- **Create**: `pb.collection("posts").create({ title, content, user: pb.authStore.record.id })`
- **Read**: `pb.collection("posts").getFullList({ filter: 'user = "..."' })`
- **Update**: `pb.collection("posts").update(id, { title, content })`
- **Delete**: `pb.collection("posts").delete(id)`

As regras de API configuradas na coleção `posts` (passo 3.3) garantem, do lado do servidor, que um usuário nunca consiga ler ou alterar posts de outro usuário — mesmo que tente manipular a filter pelo navegador.

## Configuração do endereço do PocketBase

O endereço do servidor PocketBase está fixo em [lib/pocketbase.ts](lib/pocketbase.ts):

```ts
export const pb = new PocketBase("http://127.0.0.1:8090");
```

Se você rodar o PocketBase em outra porta, host ou em produção, atualize esse arquivo.

## Problemas comuns

**"Erro ao carregar os posts" mesmo com o PocketBase rodando**
Confirme que a coleção `posts` existe e tem os campos e API Rules do passo 3.3. Sem as regras de `Create`/`List` configuradas, o PocketBase bloqueia a requisição.

**A tela mostra um erro rapidamente e depois os dados aparecem certos**
Isso pode acontecer em modo de desenvolvimento (`pnpm dev`) por causa do *Strict Mode* do React, que executa efeitos duas vezes — a segunda requisição cancela a primeira automaticamente no SDK do PocketBase. Isso já está tratado no código com a opção `requestKey: null` em [app/posts/page.tsx](app/posts/page.tsx).

**`ECONNREFUSED` ou falha de rede ao logar/cadastrar**
O PocketBase não está rodando, ou está rodando em outra porta. Confirme com `curl http://127.0.0.1:8090/api/health` — a resposta deve ser `{"message":"API is healthy."}`.

**Erro 400 "Failed to create record" no cadastro**
A senha precisa ter no mínimo 8 caracteres, e "Confirmar senha" precisa ser idêntica à senha.

## Scripts disponíveis

```bash
pnpm dev      # inicia o servidor de desenvolvimento em http://localhost:3000
pnpm build    # gera a build de produção
pnpm start    # roda a build de produção (rode "pnpm build" antes)
pnpm lint     # roda o eslint
```

## MCP do PocketBase (opcional, para quem usa Claude Code)

Este repositório inclui um [.mcp.json](.mcp.json) configurando o servidor `dynamic-pocketbase-mcp`, que permite gerenciar collections do PocketBase (criar, editar regras, etc.) diretamente pela conversa com IA, sem precisar abrir o painel admin manualmente. Isso é totalmente opcional — o projeto funciona normalmente sem ele, usando apenas o painel admin do PocketBase.

## Aprender mais

- [Documentação do Next.js](https://nextjs.org/docs)
- [Documentação do PocketBase](https://pocketbase.io/docs/)
- [SDK JavaScript do PocketBase](https://github.com/pocketbase/js-sdk)

## Deploy

Para colocar em produção, você vai precisar:

1. Hospedar o PocketBase em um servidor próprio (VPS, por exemplo) — veja o [guia oficial de deploy do PocketBase](https://pocketbase.io/docs/going-to-production/).
2. Atualizar `lib/pocketbase.ts` com o endereço público do PocketBase.
3. Fazer o deploy do Next.js na [Vercel](https://vercel.com/new) ou outra plataforma de sua preferência.
