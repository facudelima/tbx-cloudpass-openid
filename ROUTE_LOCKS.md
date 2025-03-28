# Route Locking
Basic route locking implementation using an external service (key-value store)

## Behavior
Creates a per route key to block matching request:
* a key must identify the request, for example: key =  userid+action+uniqueParam+product
* a lock is set for a given route (using a max TTL)
* the route/services executes business logic
* the lock is release

if any other matching request (same generated key) is received while the route is "locked" the result is a reject request with an API specific error

### see
* src/routes/lock.js
* test/routes/lock.spec.js

## Use cases
* avoid double call to same route (using specific routes params)

## Limitations
* is not a Semaphore (avoid resource lock a perf problems) https://en.wikipedia.org/wiki/Semaphore_(programming)
* on multiple instance deployments requires an external key-value store (redis)
* it does not handle rate-limit

## How to add to an existing project

### copy files from base
* add error release on src/app.js (see code)
* add store src/dbs/lockRedisStore.js
* config store in src/config/db.json
* copy services and middleware:
* src/config/lock.json
* src/routes/middleware/routeLock.js
* src/services/interApiLockService.js
* test/redis.js

### setup
* check lates db drivers and mocks (update from base src/dbs/common)
* copy files from base (as mentioned in previous section)
* setup redis server (ask Arq team)
* install "ioredis" dependency
* set envs vars

