# Bun has a dedicated official image — use it directly for the backend.
FROM oven/bun:1

WORKDIR /app

# Install dependencies first to leverage Docker layer caching.
# (No lockfile is committed for this minimal app, so we don't use --frozen-lockfile.)
COPY package.json ./
RUN bun install --production

# Copy application source.
COPY tsconfig.json ./
COPY src ./src

# SQLite data directory (also mounted as a volume in docker-compose for persistence).
RUN mkdir -p /app/data
ENV DB_PATH=/app/data/tasks.sqlite
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD bun -e "fetch('http://localhost:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["bun", "src/index.ts"]
