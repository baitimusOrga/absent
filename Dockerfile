# Dockerfile
FROM nginx:alpine
RUN echo "Hello from the build pipeline" > /usr/share/nginx/html/index.html