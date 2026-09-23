FROM oven/bun:1.3.14

WORKDIR /app

COPY package.json bun.lock ./
COPY client/package.json client/package.json
COPY server/package.json server/package.json

RUN bun install --frozen-lockfile

COPY . .

RUN bun run build

ENV NODE_ENV=production
EXPOSE 3001

CMD ["bun", "run", "start"]
