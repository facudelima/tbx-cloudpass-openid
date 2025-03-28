# TBX base NODE.js #

Node.js base project. TODO: modify this file as needed

*Remember to edit this file: add your project description and configs*

### Framework special methods reference

##### ApiClients & external service (+ circuit breaker)
Check the usage example in:
* src/services/ExternalTestService.js

##### Cache
Check the usage example in (requires sharedLib v18.10):
* src/services/TestService.js cacheFactoryService usage
* src/services/TestService.js methods: "getSomethingExpensive" and "getSomethingEvenMoreExpensive"
* Optional config in src/app.js using a store: `cacheFactoryService.setDefaultExternalCacheStore(...)`

##### APM & background transactions
Check the usage example in:
* src/services/TestService.js method "doSomething"

##### Rote locks
* see ROUTE_LOCKS.md for reference

##### Special services methods used in /system route:
* see SPECIAL_METHODS.md for reference

### Database changes

Keep script updated in `scripts/database` and see `scripts/database/README.md`

Keep track of db changes:
* add indexes in .js files in `scripts/database/{collectionName}.js`
* add information in readme and project changelogs
* see [Guía para modificaciones en DBs productivas](https://toolboxdigital.atlassian.net/wiki/x/JwAt5)

### for CRONs & changes:

##### CRONs.md
* Add cron job descriptions and urls

##### CHANGELOG.md
* Add changes
* describe breaking changes

### env vars
see envs/development.env file for required vars.

use a custom .env file to run in you local machine

*dont expose production keys or settings*

### Project layout
```
CRONs.md
|____## describes project crons
Dockerfile
|____## main dockerfile
docs
|____## docs are build here in buildtime
envs
|____## project envs files (for local use only)
package.json  package-lock.json
|____## NodeJs packages
README.md
|____## this file
src
|____## main project files
test
|____## test files
```

### Project SRC layout
```
src
|____docs
| |____## docs are build here in buildtime
|____app.js
|____config
| |____## configs files in JSON format (see tbxlibs.config)
|____modules
| |____## general modules for express & system
|____services
| |____## main service files
|____dbs
| |____## db files & logic
|____public
| |____## public items
|____server
| |____app.js ## main server app
|____routes
| |____schemas
| | |____## route params validation schemas (using Joi)
| |____## express routes
```

#### What should I code in "routes" (Presentation)?
Routes can understand web frameworks, HTTP & REST.
It's ok to:
* Parse and validate responses
* Validate params using schemas
* Add middleware configs
* Call multiple internal services
* Unify and create responses

It's *not* ok to:
* Add business specific logic
* Create or Call DB querys
* Add Test here

#### What should I code in "services" (Application/Business Logic)?
Services understand Business Logic

It's ok to:
* Call multiple internal services
* Add business specific logic
* Call dbStore methods
* Call external services & APIs

It's *not* ok to:
* Create or Call DB querys
* Add Test here
* Parse and validate responses
* Validate params using schemas
* Add middleware configs
* Unify and create responses

#### What should I code in "db" (Data) ?
dbStores handle find/update/delete operations in the service database

It's ok to:
* Create or Call DB querys
* Parse Objects from/to the database
* Handle db drivers

It's *not* ok to:
* Call external services & APIs
* Call multiple internal services
* Add business specific logic
* Add Test here
* Parse and validate responses
* Validate params using schemas
* Add middleware configs
* Unify and create responses

### Run with Docker
In order to use internal libs, you'll need to create a passwordless ssh key for docker (default `~/.ssh/id_rsa`), you can follow https://support.atlassian.com/bitbucket-cloud/docs/set-up-an-ssh-key/


#### example:
* LIBNODE_SSH_KEY=$( base64 -w 0 ~/.ssh/id_rsa )
* docker build --build-arg LIBNODE_SSH_KEY=${LIBNODE_SSH_KEY} -t tbx/base-nodejs .
* docker run --env-file=envs/development.env -p 3000:3000 --rm -it tbx/base-nodejs

#### Use docker-compose (https://docs.docker.com/compose/)
* docker-compose build
* docker-compose up

### Test & QA
Remember to run `npm test` before pushing your code!

### CORS
See src/app.js for CORS config

#### Mock reference

see DB_MOCKS.md for reference

#### code coverage
Follow the coverage and test rules in `package.json`
Check coverage before pushing your changes

#### Public API docs
DEV & CERT can see docs in:
/docs/ -> jsDoc
/explorer/ -> Swagger

just set TBX_SHOW_API_DOCS=true

For local runs:
http://localhost:3000/docs/
http://localhost:3000/explorer/

#### JMeter test & automation
See  `test/jmeter` folder for details.


### Based on standard.js

* https://standardjs.com/
* Based on: https://github.com/standard/eslint-config-standard

Ignored:
* one-var
* semi
* space-before-function-paren
