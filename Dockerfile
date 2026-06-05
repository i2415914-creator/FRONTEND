# --- ETAPA 1: Compilación ---
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Declaramos el argumento que Coolify le pasará al build
ARG VITE_API_URL
# Creamos el archivo .env en caliente justo antes de compilar
RUN echo "VITE_API_URL=$VITE_API_URL" > .env

RUN npm run build

# --- ETAPA 2: Servidor de Producción ---
FROM nginx:alpine
# Copiamos un Nginx básico (ya no necesita reglas de proxy complejas)
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]