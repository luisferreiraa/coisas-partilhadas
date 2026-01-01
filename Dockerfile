# Build
FROM node:20-alpine AS builder
WORKDIR /app

# Copiar apenas package.json, package-lock.json e Prisma
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

# Copiar restante do código
COPY . .

# Gerar Prisma Client
RUN npx prisma generate

# Build Next.js
RUN npm run build

# Produção
FROM node:20-alpine AS runner
WORKDIR /app

# Criar usuário não-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar build da aplicação
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3006
ENV PORT 3006
ENV HOSTNAME "0.0.0.0"

# Rodar a aplicação standalone
CMD ["node", "server.js"]
