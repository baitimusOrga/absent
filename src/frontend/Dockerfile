FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=development

COPY package*.json ./
RUN npm install

COPY . .
COPY .env.development .env

EXPOSE 4200


CMD ["npm", "run", "start"]
