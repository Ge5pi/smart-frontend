# Сборка frontend-приложения (Vite/React)
FROM node:20 as builder

WORKDIR /app

# Копируем package.json и lock
COPY package.json package-lock.json ./
RUN npm install

# Копируем исходный код
COPY . .
RUN npm run build

# Продакшн-сервер: nginx
FROM nginx:stable-alpine

# Копируем собранный проект из builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Удаляем дефолтный конфиг и вставляем свой
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
RUN apk add --no-cache bind-tools curl
CMD ["nginx", "-g", "daemon off;"]
