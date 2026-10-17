#how to build the backend image

FROM node:20-alpine 
#  start from a tiny Linux image that already has Node 20 installed. Alpine = only 5 MB vs 300 MB for full Linux.

WORKDIR /app
# all commands from now on run inside /app inside the container.

COPY package*.json ./
#copy package.json first, before the rest of the code. This is a Docker caching trick
# — if your code changes but package.json doesn't, Docker skips reinstalling packages.


RUN npm ci --only=production
# install only production packages (no nodemon, no test tools)



COPY . .
# copy all your source code into the container.


EXPOSE 3000
# document that this container listens on port 3000.


CMD ["node", "server.js"]
# the command that runs when the container starts

