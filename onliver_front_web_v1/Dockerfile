# Этап сборки
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install

COPY . .
RUN yarn build

# Используем официальный образ Apache
FROM httpd:2.4 AS deploy

# Копируем собранные файлы в каталог сайта
COPY --from=builder /app/dist/ /usr/local/apache2/htdocs/

# Копируем файл конфигурации для обоих доменов
COPY ./domains.conf /usr/local/apache2/conf/extra/

RUN echo "ServerName localhost" >> /usr/local/apache2/conf/httpd.conf

# Включаем наши конфигурационные файлы в httpd.conf
RUN echo 'Include conf/extra/domains.conf' >> /usr/local/apache2/conf/httpd.conf

# Экспонируем порт 80
EXPOSE 80

# Запускаем Apache в фоновом режиме
CMD ["httpd-foreground"]
