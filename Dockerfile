FROM node:10.15.3

LABEL maintainer="webB1anyaoyao@gmail.com"

COPY . /app

WORKDIR /app

RUN npm install

RUN ls

RUN npm install --registry=https://registry.npm.taobao.org

RUN ls

EXPOSE 3000

CMD [ "npm", "start"]