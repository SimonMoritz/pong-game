# Start your image with a node base image
FROM node:22

# The /app directory should act as the main application directory
WORKDIR /app

# Copy package manifest first for better layer caching
COPY package*.json ./

RUN npm install

# Copy application source
COPY . .

EXPOSE 443

CMD npm start
