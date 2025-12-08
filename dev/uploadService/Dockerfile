# Fetching the minified node image on apline linux
FROM node:lts-slim

WORKDIR /uploadService
COPY . .

RUN apt-get update && \
  apt-get install -y openssl && \
  openssl req -newkey rsa:2048 -nodes -keyout key.pem -x509 -sha256 -days 3650 -subj /CN=localhost -out cert.pem

RUN npm install

CMD ["node", "index.js"]

EXPOSE 3000
