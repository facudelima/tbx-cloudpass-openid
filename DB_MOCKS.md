#  DB Mock reference
* configure env vars in tbxlibs.js
* Follow the examples in src/dbs/testMongoStore.js

### Main envs
```shell
REDIS_DRIVER=mockedredis
DB_ELASTICSEARCH_DRIVER=mock
DB_PG_DRIVER=mock
DB_MONGO_DRIVER=mockedmongodb
```
## Using in-memory mongo db

### redis
REDIS_DRIVER=mockedredis
Main mock: src/dbs/common/drivers/mockedredis.js

### mongo
DB_MONGO_DRIVER=mockedmongodb
Library used: https://github.com/nodkz/mongodb-memory-server

## How to add to an existing project

### copy files from base
* src/dbs/common/drivers/mockedredis.js
* src/dbs/common/drivers/mockedmongodb.js
* test/mongodb.js
* test/redis.js
* test/dbs/mockedmongodb/*

### setup package.json

* add dev dependency: "mongodb-memory-server": "^7.6.3",
* modify test script:
```json
{
  "test": "cross-env LOG_LEVEL=error NODE_ENV=test MONGOMS_DEBUG=0 ./node_modules/mocha/bin/mocha -u bdd --timeout 99999 --colors --exit --file ./test/mongodb.js './test/**/*.spec.js'",
}
```

### setup Dockerfile (alpine)
```dockerfile
## needed in test
RUN echo 'http://dl-cdn.alpinelinux.org/alpine/v3.6/main' >> /etc/apk/repositories && \
    echo 'http://dl-cdn.alpinelinux.org/alpine/v3.6/community' >> /etc/apk/repositories && \
    apk update && \
    apk add mongodb=3.4.4-r0

# RUN NODE_ENV=test npm test ->
RUN MONGOMS_SYSTEM_BINARY=/usr/bin/mongod MONGOMS_VERSION=3.4.4 NODE_ENV=test npm test
```
