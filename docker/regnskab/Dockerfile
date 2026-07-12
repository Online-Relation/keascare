FROM node:20-alpine
WORKDIR /app
COPY package.json .
RUN npm install
COPY scraper.js .
CMD ["node", "scraper.js"]
