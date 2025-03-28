## global args
ARG NPM_REGISTRY=http://npm-cache.tbxnet.com/

##################################################
# PROJECT BASE IMAGE
FROM node:22.12-alpine as tbxnodebase

RUN apk --no-cache add ca-certificates
RUN update-ca-certificates

##################################################
# PROJECT BUILDER IMAGE
FROM tbxnodebase as Builder

# private key, for this image only
ARG LIBNODE_SSH_KEY

ENV NPM_REGISTRY=${NPM_REGISTRY:-http://npm-cache.tbxnet.com/}
ENV PORT 3000
ENV NODE_ENV production
ENV PATH ./node_modules/.bin:$PATH

RUN mkdir -p /tmp/build && mkdir -p /usr/src/app

RUN npm config set registry $NPM_REGISTRY

RUN apk add --no-cache python3 g++ make libxml2-dev git openssh coreutils

RUN echo ${LIBNODE_SSH_KEY} > /tmp/b64key

RUN mkdir -p /root/.ssh/
RUN base64 --decode /tmp/b64key > /root/.ssh/id_rsa
RUN rm /tmp/b64key

# Make sure your domain is accepted
RUN touch /root/.ssh/known_hosts
RUN ssh-keyscan -T 30 bitbucket.org >> /root/.ssh/known_hosts

RUN chmod 600 /root/.ssh/id_rsa

WORKDIR /tmp/build

COPY ./package* /tmp/build/

# Install run deps & bkp node modules
RUN NODE_ENV=production npm ci --omit=dev --silent && mv /tmp/build/node_modules /tmp/node_modules_prod

# Install development dependencies
RUN NODE_ENV=development npm ci --quiet

# Needed in test
RUN echo 'http://dl-cdn.alpinelinux.org/alpine/v3.6/main' >> /etc/apk/repositories && \
    echo 'http://dl-cdn.alpinelinux.org/alpine/v3.6/community' >> /etc/apk/repositories && \
    apk update && \
    apk add mongodb=3.4.4-r0

COPY ./ /tmp/build

# Run Unit Tests
RUN MONGOMS_SYSTEM_BINARY=/usr/bin/mongod MONGOMS_VERSION=3.4.4 NODE_ENV=test npm test

# Building app
RUN set -x && \
    npm run build:docs && \
    mv /tmp/build/docs/ /usr/src/app/docs && \
    mv /tmp/build/src/ /usr/src/app/src && \
    mv /tmp/build/package* /usr/src/app/ && \
    cd /usr/src/app && \
    mv /tmp/node_modules_prod /usr/src/app/node_modules

RUN rm /root/.ssh/id_rsa


##################################################
# DEPLOYMENT IMAGE
FROM tbxnodebase
ENV PORT 3000
ENV NODE_ENV production
ENV PATH ./node_modules/.bin:$PATH

RUN mkdir -p /usr/src/app

COPY --from=Builder /usr/src/app /usr/src/app
COPY --from=Builder /usr/src/app/package.json /usr/src/package.json
COPY ./*.md /usr/src/app/

WORKDIR /usr/src/app
EXPOSE ${PORT}

CMD ["node", "--max-old-space-size=2048", "./src/server/app.js"]
