# Start your image with a node base image
FROM node:18-alpine

# The /app directory should act as the main application directory
WORKDIR /app

# Copy the app package and package-lock.json file
#COPY package*.json ./

# Copy local directories to the current local directory of our docker image (/app)
COPY . .

RUN npm install

EXPOSE 443

CMD node server.js
