# 1. Etapa de instalación de dependencias
FROM node:18-alpine AS builder
WORKDIR /

COPY package*.json ./
RUN npm install --production

COPY . .

# 2. Etapa de ejecución, imagen más ligera
FROM node:18-alpine
WORKDIR /

COPY --from=builder / ./

EXPOSE 3000
CMD ["node", "server.js"]
