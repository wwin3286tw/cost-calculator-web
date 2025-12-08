FROM nginx:1.27-alpine

WORKDIR /usr/share/nginx/html
RUN rm -rf ./*
COPY index.html ./
COPY assets ./assets
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
