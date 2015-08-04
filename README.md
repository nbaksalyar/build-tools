# Gulp based builds.


* Copy and rename the seed_package.json to package.json
* Run `npm install` to  install the bootstrap dependencies
* Run `npm run update` to install all require dependencies
* Run `npm run deploy` to build everything to build/ and to copy a .war file to your $WORK_DIR/work/webapps dir
   This will use the following pipeline:

   * Compile everything in "src/" using Babel (ES6), concat, minimize and gzip
   * Compile all bower dependencies into build/dependencies.[js|css] and then concat, minimize and gzip

## Build pipeline

###src/*.js
	Babel (ES6) > concat -> uglify -> gzip -> build/ 
	
###src/*.hbs
	Handlebars -> concat into main JS, available in browser as TEMPLATES['name without extension']
	


## Dev mode
* Run `npm run deploy-watch` to create pseudo concated JS files that just link to files in *dist/*
* Run `npm run watch` to start a webserver at :8000 that watches for changes and places built files in *dist/*

## Customizing builds using bower.json and package.json


#### bower.json
All bower dependencies with main files are concatenanted together, this can be overriden in bower.json as follows:

```json 
"overrides": {
                    "bootstrap": {"main": ["dist/js/bootstrap.js","dist/css/bootstrap.css", "dist/css/bootstrap.css.map"]},
       }
    }
```
To exclude certain large libraries from concatenantion list in exclude, the main files will be concated together and placed in build/<libray name>
```json
   "excludes": ["handsontable", "codemirror"]
```

### package.json

```json
concatDist: ['compile time order'] // use to specifiy the order in which JS files are concatenanted
```