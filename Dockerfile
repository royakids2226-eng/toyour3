FROM node:22-alpine

WORKDIR /app

# تثبيت pnpm
RUN npm install -g pnpm

# نسخ package.json أولاً للاستفادة من caching
COPY package.json ../

# نسخ pnpm-lock.yaml إذا موجود
COPY pnpm-lock.yaml* ../

# تثبيت dependencies
RUN pnpm install --frozen-lockfile

# نسخ باقي الملفات
COPY . .

# توليد Prisma client
RUN pnpm exec prisma generate

# بناء التطبيق
RUN pnpm run build

# تشغيل التطبيق
CMD ["pnpm", "start"]
