#!/bin/bash

set -u
set -e

if [[ -d dist_nodejs ]]
then
    REPO_DIR="$PWD"
elif [[ -d ../dist_nodejs ]]
then
    REPO_DIR="$(dirname $PWD)"
else
    echo "This script must be run from the concrete-js root dir or an immediate subdirectory." >&2
    exit 1
fi

INPUT_ENTRY_PATH="$REPO_DIR/integration_test_nodejs/doc-0.bp.json"
INPUT_CORPUS_PATH="$REPO_DIR/integration_test_nodejs/corpus.bp.json"
DIST_DIR="$REPO_DIR/dist_nodejs"
TEMP_DIR=`mktemp -d`

pushd "$TEMP_DIR"

[[ -d $DIST_DIR ]]
[[ -f $INPUT_ENTRY_PATH ]]
[[ -f $INPUT_CORPUS_PATH ]]

echo "Installing package..."
npm init -y
npm i "$DIST_DIR"

echo "Starting server..."
npx concrete-convert-bpjson-server &
SERVER_PID="$!"
cleanup() {
    echo "Cleaning up..."
    rm -rf doc-0.concrete
    rm -rf doc-0.concrete.zip
    popd
    rm -rf "$TEMP_DIR"
    kill $SERVER_PID
    echo "Done"
}
trap cleanup EXIT

echo "Running clients..."
npx concrete-convert-client localhost 9000 -i "$INPUT_ENTRY_PATH" -o doc-0.concrete
echo OK
npx concrete-convert-bpjson-client localhost 9000 -i "$INPUT_CORPUS_PATH" -o doc-0.concrete.zip
echo OK
