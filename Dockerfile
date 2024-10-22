FROM node:22.2-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json /app/

RUN npm install
COPY app ./app
COPY public ./public
COPY *.js *.mjs *.json .env* ./
RUN npm run build

FROM node:22.2-alpine AS runner
WORKDIR /app

COPY --from=builder /app/public ./public

RUN mkdir .next

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static


RUN chown -R 1000:4085 /app/.next

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
