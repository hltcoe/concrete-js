#!/bin/bash

# Path to local copy of concrete repo: https://github.com/hltcoe/concrete
CONCRETE_REPO="${HOME}/concrete"

# Check for Thrift
# Procedure copied from:
#   http://stackoverflow.com/questions/592620/how-to-check-if-a-program-exists-from-a-bash-script
command -v thrift >/dev/null 2>&1 || { echo >&2 "Cannot find 'thrift' executable. Aborting."; exit 1; }

for P in `find ${CONCRETE_REPO}/thrift -name '*.thrift'`; do
    thrift --gen js:jquery $P
done

# Create single JS file by concatenating generated JS files
cat gen-js/*.js > dist/concrete.js

# Download latest/greatest thrift.js
cd dist
curl -O https://raw.githubusercontent.com/apache/thrift/master/lib/js/src/thrift.js
