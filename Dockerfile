FROM node:latest

COPY package*.json ./

RUN npm install

# Bundle app source
COPY . .

CMD npm start