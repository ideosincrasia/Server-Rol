# 1. Etapa de instalación de dependencias
FROM node:18-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

# 2. Etapa de ejecución, imagen más ligera
FROM node:18-alpine
WORKDIR /app

COPY --from=builder /app ./

EXPOSE 3000
CMD ["node", "index.js"]