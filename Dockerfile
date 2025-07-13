# Сборка frontend-приложения (Vite/React)
FROM node:20 as builder
# force rebuild 2025-07-10

WORKDIR /app

ARG REBUILD_TRIGGER=default
ENV REBUILD_TRIGGER=${REBUILD_TRIGGER}

# Копируем package.json и lock
COPY package.json package-lock.json ./
RUN echo "🚨 Triggered rebuild: $REBUILD_TRIGGER" && npm install --force

# Копируем исходный код
COPY . .
RUN npm run build

# Продакшн-сервер: nginx
FROM nginx:stable-alpine
ARG FORCE_REBUILD
ENV FORCE_REBUILD=${FORCE_REBUILD}
RUN echo "Rebuild marker: $FORCE_REBUILD"
# Копируем собранный проект из builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Удаляем дефолтный конфиг и вставляем свой
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
RUN apk add --no-cache bind-tools curl
CMD ["nginx", "-g", "daemon off;"]
