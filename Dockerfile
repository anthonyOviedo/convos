FROM node:20-alpine AS build-client
WORKDIR /build
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY server/ ./
COPY --from=build-client /build/../server/public ./public
EXPOSE 3000
CMD ["node", "index.js"]
