FROM node:22-alpine

WORKDIR /app

# تثبيت pnpm
RUN npm install -g pnpm

# نسخ package.json أولاً للاستفادة من caching
COPY package.json pnpm-lock.yaml* ./

# تثبيت dependencies
RUN pnpm install --frozen-lockfile

# نسخ باقي الملفات
COPY . .

# توليد Prisma client وبناء التطبيق
RUN pnpm run prisma:generate
RUN pnpm run build

# تشغيل التطبيق
CMD ["pnpm", "start"]
