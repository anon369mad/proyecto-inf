# syntax=docker/dockerfile:1

ARG NODE_VERSION=20.14.0

################################################################################
# Base image for Node.js and building the application
FROM node:${NODE_VERSION}-alpine as base
WORKDIR /usr/src/app

################################################################################
# Install dependencies
FROM base as deps
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json ./
RUN npm install

################################################################################
# Build the Angular application
FROM deps as build
COPY . .
RUN npm run build

################################################################################
# Use nginx to serve the static files
FROM nginx:alpine as final

# Copia la salida del build de la aplicación Angular al directorio de nginx
COPY --from=build /usr/src/app/dist/proyecto/browser /usr/share/nginx/html

# Configuración de Nginx
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]