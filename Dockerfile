# Сборка frontend-приложения (Vite/React)
FROM node:20 as builder

# Вставляем маркер, чтобы форсировать пересборку (меняй значение при каждом деплое)
ARG REBUILD_TRIGGER=2025-07-11-02
ENV REBUILD_TRIGGER=$REBUILD_TRIGGER

WORKDIR /app

# Копируем зависимости
COPY package.json package-lock.json ./
RUN echo "🚨 Triggered rebuild: $REBUILD_TRIGGER" && npm install --force

# Копируем весь проект
COPY . .
RUN npm run build

# Продакшн-сервер: nginx
FROM nginx:stable-alpine

# Копируем собранный фронт
COPY --from=builder /app/dist /usr/share/nginx/html

# Кастомный конфиг nginx
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Утилиты для отладки
RUN apk add --no-cache bind-tools curl

CMD ["nginx", "-g", "daemon off;"]
