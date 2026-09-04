# Coisas Partilhadas

Aplicação web para partilha e organização de recursos (documentos, links e ficheiros) entre um grupo fechado de utilizadores. Permite consultar, pesquisar, filtrar por tipo/tema e marcar itens como favoritos, com upload de ficheiros para armazenamento em nuvem.

## Funcionalidades

- **Autenticação** com sessão via JWT em cookie `httpOnly` (login/logout, verificação de sessão).
- **Gestão de itens partilhados**: título, descrição, tipo, temas, links e ficheiros anexados.
- **Upload de ficheiros** para um bucket S3 (ou compatível), com geração de URLs de acesso.
- **Pesquisa e filtros**: por texto (título/descrição), por tipo, por tema e por favoritos.
- **Paginação** da listagem de itens.
- **Favoritos** por utilizador.
- **Documentação interna** da app, gerada em Markdown e navegável em `/docs` (uso interno da equipa, não incluída no repositório público — ver secção [Documentação interna](#documentação-interna)).

## Stack técnica

| Camada | Tecnologia |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router, React 19) |
| Linguagem | TypeScript |
| Estilos / UI | Tailwind CSS 4, [Radix UI](https://www.radix-ui.com/), [shadcn/ui](https://ui.shadcn.com/), `lucide-react` |
| Base de dados | PostgreSQL |
| ORM | [Prisma 7](https://www.prisma.io/) |
| Autenticação | JWT (`jsonwebtoken`) + `bcrypt` para hashing de passwords |
| Armazenamento de ficheiros | AWS S3 (`@aws-sdk/client-s3`) |
| Containerização | Docker / Docker Compose |

## Pré-requisitos

- [Node.js](https://nodejs.org/) 20 ou superior
- [Docker](https://www.docker.com/) e Docker Compose (recomendado, evita instalar Postgres localmente)
- Uma conta AWS com um bucket S3 (ou outro serviço compatível com a API S3), **apenas se quiseres testar o upload de ficheiros**

## Configuração do ambiente

1. Clona o repositório e instala as dependências:

   ```bash
   git clone https://github.com/luisferreiraa/coisas-partilhadas.git
   cd coisas-partilhadas
   npm install
   ```

2. Cria um ficheiro `.env` na raiz do projeto com as seguintes variáveis:

   ```env
   # Ligação à base de dados PostgreSQL
   DATABASE_URL="postgresql://coisas_user:password123@localhost:5432/coisas_partilhadas"

   # Credenciais AWS para upload de ficheiros (usar uma chave IAM com permissões
   # restritas ao bucket, nunca a chave root da conta)
   AWS_ACCESS_KEY_ID=""
   AWS_SECRET_ACCESS_KEY=""
   AWS_REGION=""
   AWS_S3_BUCKET=""

   # URL pública da API, usada pelo cliente
   NEXT_PUBLIC_API_URL="http://localhost:3000/api"

   # Segredo usado para assinar os JWT de sessão — gera um valor aleatório forte,
   # por exemplo com: openssl rand -base64 32
   JWT_SECRET=""
   ```

   > ⚠️ **Nunca** faças commit do ficheiro `.env` nem de credenciais reais. O `.gitignore` já o exclui do repositório.

## Como correr o projeto

### Opção A — Docker Compose (recomendado)

Levanta a aplicação e a base de dados PostgreSQL num único comando:

```bash
docker compose up --build
```

A aplicação fica disponível em [http://localhost:3006](http://localhost:3006).

Este comando aplica automaticamente as migrações do Prisma no arranque do container (`prisma migrate deploy`).

### Opção B — Ambiente local (sem Docker)

1. Garante que tens um servidor PostgreSQL a correr e que `DATABASE_URL` no `.env` aponta para ele.
2. Aplica as migrações e gera o cliente Prisma:

   ```bash
   npx prisma migrate dev
   ```

3. (Opcional) Popula a base de dados com utilizadores de teste:

   ```bash
   npx tsx prisma/seed.ts
   ```

   > O script de seed cria utilizadores com passwords fracas, apenas para fins de desenvolvimento local. Não usar em produção.

4. Arranca o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

5. Abre [http://localhost:3000](http://localhost:3000) no browser.

## Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Arranca o servidor de desenvolvimento Next.js |
| `npm run build` | Compila a aplicação para produção |
| `npm run start` | Arranca a aplicação já compilada |
| `npm run lint` | Corre o ESLint sobre o código |
| `npx prisma migrate dev` | Aplica migrações da base de dados em desenvolvimento |
| `npx prisma studio` | Interface visual para inspecionar a base de dados |

## Estrutura do projeto

```
app/                  # Rotas e páginas (Next.js App Router)
  api/                # Endpoints da API (auth, items, favorites)
  items/              # Páginas de detalhe de itens
components/           # Componentes React reutilizáveis (UI e domínio)
lib/                  # Clientes e utilitários partilhados (Prisma, S3, JWT, auth)
prisma/               # Schema, migrações e seed da base de dados
public/               # Ficheiros estáticos
```

## Modelo de dados

- **User** — utilizadores da aplicação (username, password com hash).
- **Item** — recurso partilhado (tipo, título, descrição, temas, links, ficheiros).
- **Favorite** — relação entre utilizador e item marcado como favorito.

Ver o esquema completo em [`prisma/schema.prisma`](prisma/schema.prisma).

## Documentação interna

A pasta `app/docs` e o conteúdo em `public/docs` alimentam uma secção de documentação técnica interna da aplicação, não incluída neste repositório público (ver `.gitignore`).

## Segurança

- As passwords são guardadas com hash `bcrypt`, nunca em texto simples.
- As sessões usam JWT assinado, armazenado num cookie `httpOnly` e `secure` em produção.
- Nunca partilhes nem comites o teu `.env`. Se uma credencial (AWS, `JWT_SECRET`, etc.) for exposta acidentalmente, roda-a imediatamente.

## Licença

Projeto privado / uso pessoal. Sem licença de distribuição definida.
