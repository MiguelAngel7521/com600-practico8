# Adaptado de Práctica 2/Parte 1/api/dockerfile para el servicio de la Práctica 7.
# Sus dependencias necesitan Node >=22.15.0.
FROM node:22-alpine

WORKDIR /app
COPY package.json package-lock.json ./

# Imagen de laboratorio: incluye Jest y Testcontainers para conservar las pruebas.
RUN npm ci --no-audit --no-fund

COPY src ./src
COPY tests ./tests
COPY jest.config.js eslint.config.cjs analizar.cjs verificar-mongo.cjs ./

USER node
EXPOSE 3000
CMD ["npm", "start"]
