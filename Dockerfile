# Build
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

# Produção
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# ADICIONE ESTA COPIA: Copia dependências de produção
COPY --from=builder /app/node_modules ./node_modules 

# 💥 CORREÇÃO CRÍTICA AQUI: Copiar o prisma.config.ts da raiz do builder
# O CLI do Prisma (migrate deploy) precisa deste arquivo para resolver a DATABASE_URL.
COPY --from=builder /app/prisma.config.ts ./ 

# Copias que você já tinha
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/lib ./lib

USER nextjs
EXPOSE 3006
ENV PORT=3006

# Mantenha o CMD original. A variável DATABASE_URL deve ser resolvida
# corretamente agora que o prisma.config.ts está presente.
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && node server.js"]
#CMD ["sh", "-c", "npx prisma migrate reset --force && npx prisma db seed && node server.js"]
