# استخدام نسخة Node.js خفيفة
FROM node:20-slim

# تثبيت مكتبات النظام الضرورية لـ Prisma (OpenSSL)
RUN apt-get update -y && apt-get install -y openssl

# تحديد مسار العمل
WORKDIR /app

# نسخ ملفات تعريف المكتبات أولاً (للاستفادة من الكاش)
COPY package.json package-lock.json* ./

# تثبيت المكتبات
RUN npm install

# نسخ باقي ملفات المشروع
COPY . .

# توليد ملفات بريزما
RUN npx prisma generate

# بناء مشروع Next.js
# نتجاهل الـ Linting و Type Checking لتسريع البناء وتجنب الأخطاء البسيطة
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# إعداد المنفذ
EXPOSE 3000

# أمر التشغيل (الذي عدلناه في package.json)
CMD ["npm", "start"]