#!/bin/bash

if [[ -z "$RAILS_ENV" ]]; then
  export RAILS_ENV=packaging
fi
GPDB_HOST=chorus-gpdb-ci

. script/ci/setup.sh

rm -fr .bundle
GPDB_HOST=$GPDB_HOST bundle exec rake package:installer --trace
