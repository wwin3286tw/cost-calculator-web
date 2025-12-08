FROM httpd:2.4

WORKDIR /usr/local/apache2/htdocs/
RUN rm -rf ./*
COPY index.html ./
COPY assets ./assets

EXPOSE 80
CMD ["httpd-foreground"]
