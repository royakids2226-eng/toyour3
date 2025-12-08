# Dockerfile بسيط للغاية
FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* pnpm-lock.yaml* ./

RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .

RUN pnpm exec prisma generate && pnpm run build

EXPOSE 3000

CMD ["pnpm", "start"]
