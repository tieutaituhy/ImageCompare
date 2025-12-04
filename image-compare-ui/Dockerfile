# 1. Base image (Dùng node alpine cho nhẹ)
FROM node:18-alpine AS base

# 2. Dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# 3. Builder (Build code Next.js)
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Lưu ý: Lúc build Next.js cần biết biến môi trường (nếu có)
# ENV NEXT_PUBLIC_API_URL=https://api.example.com
RUN npm run build

# 4. Runner (Chạy ứng dụng)
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Tạo user non-root cho bảo mật
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy file từ bước builder sang (chỉ copy cái cần thiết nhờ mode standalone)
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

USER nextjs

EXPOSE 3000
ENV PORT=3000

# Lệnh chạy server
CMD ["node", "server.js"]