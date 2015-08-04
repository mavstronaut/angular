#!/bin/bash
set -ev

echo =============================================================================
# go to project dir
SCRIPT_DIR=$(dirname $0)
source $SCRIPT_DIR/env_dart.sh
cd $SCRIPT_DIR/../..

./node_modules/.bin/gulp build.js.cjs benchpress.bundle

pub install
mkdir deploy; tar -czpf deploy/dist.tgz -C dist .
