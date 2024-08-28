FROM node:alpine

WORKDIR /app

COPY package*.json .

RUN npm ci

COPY  . . 

EXPOSE 5000

CMD ["node","app.js"]



