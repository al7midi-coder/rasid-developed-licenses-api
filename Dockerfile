FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm install
COPY src ./src
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache chromium nss freetype harfbuzz ttf-freefont
ENV CHROMIUM_PATH=/usr/bin/chromium
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
COPY migrations ./migrations
COPY rasid ./rasid
COPY seed ./seed
COPY assets ./assets
EXPOSE 8080
CMD ["node", "dist/index.js"]
