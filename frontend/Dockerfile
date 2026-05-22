# ---- Stage 1: build the React app with Bun ----
FROM oven/bun:1 AS build

WORKDIR /app

COPY package.json ./
RUN bun install

COPY . .
RUN bun run build

# ---- Stage 2: serve static assets with nginx ----
FROM nginx:alpine

# Replace the default site config with our SPA + API-proxy config.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the compiled assets from the build stage.
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
