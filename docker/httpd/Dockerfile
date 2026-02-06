FROM httpd:2.4-alpine

WORKDIR /usr/local/apache2/htdocs/
RUN rm -rf ./*
COPY index.html ./
COPY assets ./assets
RUN echo "ServerName localhost" >> /usr/local/apache2/conf/httpd.conf

EXPOSE 80
CMD ["httpd-foreground"]
