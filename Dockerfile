# Сборка frontend-приложения (Vite/React)
FROM node:20 as builder

# Вставляем маркер, чтобы форсировать пересборку
ARG REBUILD_TRIGGER
ENV REBUILD_TRIGGER=$REBUILD_TRIGGER

WORKDIR /app

COPY package.json package-lock.json ./

# Этот слой будет кэшироваться, и это нормально
RUN npm install --force

RUN touch /app/force-rebuild-${REBUILD_TRIGGER}.tmp

# Копируем весь проект. Теперь этот шаг НЕ будет кэшироваться,
# так как в директории /app появился новый уникальный файл.
COPY . .

# Этот шаг также будет выполняться заново, так как предыдущий не был взят из кэша.
RUN npm run build

# Продакшн-сервер: nginx с поддержкой кириллических шрифтов
FROM nginx:stable-alpine

# Установка шрифтов DejaVu для поддержки кириллицы (без fc-cache)
RUN apk update && \
    apk add --no-cache ttf-dejavu && \
    rm -rf /var/cache/apk/*

# Копируем собранный фронт
COPY --from=builder /app/dist /usr/share/nginx/html

# Кастомный конфиг nginx
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
