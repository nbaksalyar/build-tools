#!/bin/bash

curl  https://github.com/egis/build-tools/raw/master/build_base.xml > build/build_base.xml
curl  https://github.com/egis/build-tools/raw/master/resolve.py > build/resolve.py
find ./ -iname "lib.txt" | xargs python build/resolve.py
