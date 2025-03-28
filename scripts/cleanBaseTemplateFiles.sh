#!/usr/bin/env bash

##
## Run this sctip to cleanup base-nodejs test files & examples
##

# Project ROOT
cd ..

FOLDERS=(
./src/dbs/testDB4
./src/dbs/testDB5
)

FILES=(
./test/services/ExternalTestService.spec.js
./test/services/TestService.spec.js

./test/routes/test.spec.js

./test/dbs/mongodb.spec.js
./test/dbs/TestMongoStore.spec.js

./src/services/ExternalTestService.js
./src/services/TestService.js


./src/dbs/testDB4Store.js
./src/dbs/testDB5Store.js
./src/dbs/testMongoStore.js

./src/config/externalService.json

./src/routes/schemas/test.js
./src/routes/test.js
)

echo "cleaning folders.."

for t in ${FOLDERS[@]}; do
  echo "rm -rf $t"
  rm -rf $t
done

echo "cleaning files.."

for t in ${FILES[@]}; do
  echo "rm $t"
  rm $t
done

echo "clean ok"
