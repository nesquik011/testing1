FROM node:8
MAINTAINER "nesquik011" <dream_land_2@hotmail.com>

# cache package.json and node_modules to speed up builds
ADD package.json package.json
RUN npm i npm@latest -g
RUN npm install --production
RUN npm install -g nodemon

ADD . .
EXPOSE 8000
CMD ["nodemon", "bin/cnc"]
