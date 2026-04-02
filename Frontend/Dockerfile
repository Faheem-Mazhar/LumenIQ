# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ .

ARG VITE_API_BASE_URL=http://localhost:8000
ARG VITE_CHAINLIT_URL=http://localhost:8001
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_CHAINLIT_URL=$VITE_CHAINLIT_URL

RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
