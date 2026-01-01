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
# O Next.js STANDALONE copia o que ele precisa, mas o prisma CLI 
# para o 'migrate deploy' precisa do seu node_modules de produção.
COPY --from=builder /app/node_modules ./node_modules 

# Copias que você já tinha
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3006
ENV PORT=3006

# Use npx, que encontrará o binário Prisma dentro do node_modules copiado
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]