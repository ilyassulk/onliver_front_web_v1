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

# Создаем каталог для SSL-сертификатов
RUN mkdir -p /usr/local/apache2/conf/ssl

# Копируем SSL-сертификаты для обоих доменов
COPY certificate.crt /usr/local/apache2/conf/ssl/
COPY certificate.key /usr/local/apache2/conf/ssl/

# Копируем файл конфигурации для обоих доменов
COPY ./domains.conf /usr/local/apache2/conf/extra/

# Копируем SSL конфигурацию
COPY ./ssl.conf /usr/local/apache2/conf/extra/

RUN echo "ServerName localhost" >> /usr/local/apache2/conf/httpd.conf

# Включаем наши конфигурационные файлы в httpd.conf
RUN echo 'Include conf/extra/ssl.conf' >> /usr/local/apache2/conf/httpd.conf \
    && echo 'Include conf/extra/domains.conf' >> /usr/local/apache2/conf/httpd.conf

# Экспонируем порты 80 и 443
EXPOSE 80
EXPOSE 443

# Запускаем Apache в фоновом режиме
CMD ["httpd-foreground"]
