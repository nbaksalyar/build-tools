# Gulp based builds.

## for MacOS users:
```shell
# install 'native' (not Apple-supplied) Python to be able to install 'glue' tool:
brew install python

# install 'glue' tool needed by build:
brew install jpeg
pip install glue

# install Karma globally for tests to start:
npm install -g karma-cli
```

## Build steps:
* Copy and rename the seed_package.json to package.json
* Run `npm install` to  install the bootstrap dependencies
* Run `npm run setup` to install and build all required dependencies 
* Run `npm run dev` to  build files suitable for wathcing and startup a watch server
* Run `npm run build` to build a package suitable for production
* Run `npm run test` to run karma test suites
* Optional: Add an alias: `alias build='gulp --gulpfile node_modules/build-tools/Gulpfile.js --cwd ./'`
  

## Build pipeline

###stlye/*.less, *.sass, *.css
	Run through SASS or LESS >  dist/ -> concat -> uglify -> gzip -> build/ 

###src/*.js
	Babel (ES6) > concat -> uglify -> gzip -> build/ 

Concatenation order is specifed by adding a @requires annotation into the file header:
```javascript
/**
 *
 * @requires utils/Utils.js
 * @requires Form.js
 */
```	


		
###src/*.hbs
	Handlebars -> concat into main JS, available in browser as TEMPLATES['name without extension']
	
	
###resources/*, *.html
	Copied as is to build directory
	
###sprites/{set}/*.png|jpg|gif

Compiles all images into a single sprite call {set}.png sprites can be used like:

```html
<span class="sprite-{set}-{filebase}"/>
```

## Customizing builds using bower.json and package.json


#### bower.json
All bower dependencies with main files are concatenanted together, this can be overriden in bower.json as follows:

```json 
"overrides": {
           "bootstrap": {
               "main": [
                    "dist/js/bootstrap.js",
                    "dist/css/bootstrap.css", 
                    "dist/css/bootstrap.css.map"
               ]
           },
 }   
```

To exclude certain large libraries from concatenantion list in exclude, the main files will be concated together and placed in build/<libray name>
```json
   "standalone": ["handsontable", "codemirror"]
```

To exclude libraries that have already been packaged elsewhere:
```json
"excludes": ["jquery"]
```

To copy entire directories from dependencies:

```json
"directories": {
    "fontawesome": "fonts/*",
    "bootstrap": "fonts/*"
  },
```

To create a plugin package:

```json
"plugin": "PortalApp",
```
This will create a .zip instead of a .war and place all the compiled .js file in to a subdirectory *System/plugins/{plugin}*

