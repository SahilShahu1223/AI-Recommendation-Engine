# ---- Smart Recommend AI — Frontend Dockerfile ----
# Multi-stage build: compile the Vite app, then serve the static output with nginx.

FROM node:18-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# VITE_API_URL is baked into the static build at build time.
# Pass it with: docker build --build-arg VITE_API_URL=https://api.yourdomain.com/api
ARG VITE_API_URL=http://localhost:5000/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

FROM nginx:alpine AS serve
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
