FROM node:8

WORKDIR /usr/src/app

# Copy NodeCG (just the files we need)
RUN mkdir cfg && mkdir bundles && mkdir logs && mkdir db
COPY . /usr/src/app/

# Install dependencies
RUN npm install -g bower
RUN npm install --production
RUN bower install --allow-root
RUN npm install -g nodecg-cli

# RUN cd bundles && cd testAlert && nodecg install

CMD ["node", "--inspect=0.0.0.0:9229", "index.js"]
