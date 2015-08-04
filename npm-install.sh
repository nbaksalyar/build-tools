#!/bin/bash
cp package.json package.json.bak
cp node_modules/build-tools/package.json .
npm install
mv package.json.bak package.json