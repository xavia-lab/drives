FROM node:current-alpine

WORKDIR /app

RUN npm install i npm@latest -g

COPY package*.json ./

COPY ./app .

RUN npm install

EXPOSE 5000

CMD [ "node", "index.js" ]
