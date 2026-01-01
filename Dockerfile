# Build
FROM node:20-alpine AS builder
WORKDIR /app

# Copiar package.json e lock
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências
RUN npm ci

# Copiar código
COPY . .

# Gerar Prisma Client
RUN npx prisma generate

# Build da app
RUN npm run build

# Produção
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3006

# Criar user não-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copiar apenas o necessário
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

USER nextjs
EXPOSE 3006

CMD ["node", ".next/server.js"]
