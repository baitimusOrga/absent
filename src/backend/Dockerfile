FROM node:20-alpine


WORKDIR /app
ENV NODE_ENV=development

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src
COPY pdfs ./pdfs
COPY .env.development .env

EXPOSE 3000

CMD ["npm", "run", "start:dev"]
