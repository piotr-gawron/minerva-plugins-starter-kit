# Minerva plugin creation with starter-kit

Minerva plugin is a javascript file which manages its dedicated space in the Minerva page (right hand side panel). Since the plugin is a single Javascript file, all its content needs to be added/updated with JavaScript (no HTML pages). The same holds for CSS which either needs to be added via JavaSscript, or bundled using NPM (that is what starter-kit is doing), Gulp, Webpack or other similar technologies.

## General comments

* Minerva uses jQuery so plugins can use it as well since it is loaded in the global scope
* Minerva uses Bootstrap so Bootstrap styles are available to plugins as well
* Many of the functions which are used to interact with Minerva are asynchronous and thus return a [promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) and not the actual data. This holds mainly for functions for data retrieval such as `getAllBioentities` (see below).

## Building the starter-kit

The starter-kit example uses NPM (node package manager) and Browserify (and few other packages such as browserify-css or uglify) to build the plugin distriubtion file which you can publish at a URL address which can then be referenced from Minerva. To build the starter-kit you need to do the following steps:

* Download the starter-kit
* Download and install [NPM](https://nodejs.org/en/download/) if it is not yet installed on your system (try running `npm` from command line to find out)
* run `npm install` (this will create the *node_modules* directory with the required NPM modules)
* run `npm run build` to build the plugin which will be available in the *dist* directory
* publish the resulting *plugin.js* file somewhere where it can be accessed by Minerva (please beware that if the instance is running on HTTPS, the plugin must be also accessible through HTTPS)

## Plugin structure

The starter-kit contains CSS with styles sheets and JavaScript code. The kit actually uses SCSS ([Sass](https://sass-lang.com/) extension of CSS) which is then compiled into CSS during the build process. The JavaScript code consists of a single `index.js` file which:

* Registers required functions with Minerva
* Creates plugin's HTML structure
* Interacts with Minerva to do what needs to be done

#### Registering with Minerva

When the plugin is loaded into Minerva `minervaDefine` function is called, so this needs to be present in every plugin script. This function needs to return an object which maps keys `register`, `unregister`, `getName` and `getVersion` to the corresponding functions. Only the `register` function is passed an argument being the Minerva object which can then later be used to interact with the map.

#### Creating plugin's HTML structure

The Minerva object passed to the `register` function contains the `element` attribute being a jQuery object corresponding to the DOM element holding the plugin container (Minerva uses jQuery, so plugins do not need to include it). With the container element in hand, the plugin can add and modify its content freely. Of course, the plugin can also modify Minerva's DOM elements, however we strongly discourage from that.

#### Interacting with Minerva

###### Minerva proxy object

All the interaction with Minerva should happen through the minerva proxy object or ServerConnector (see next section) passed to the `register` function. To explore this object, starter-kit logs it into the console (`console.log('minerva object ', minervaProxy);`) so after the plugin is loaded, you can check out your browser's developers console and go through it. The structure of the object is following (not all attributes are mentioned):

* configuration: includes information about available types of elements, reactions, miriam types, configuration options, map types and so on
* project:  content-related data and functionaliry
  * data: functions to retrieve the data, mainly `getAllBioEntities` and `getBioEntityById`
    * beware that most of these functions are asynchronous so they actually return a promise not the actual objects
  * map: functions to interact with the visual aspect of the map, mainly `showBioEntity` (highlights a bioentity), `hideBioEntity`, `fitBounds` (zooms to provided coordinates) and `addListener` (enables listening to events such as selection of entities) - see examples of using these functions in the starter-kit and the Minerva's [JavaScript API documntation](https://git-r3lab.uni.lu/piotr.gawron/minerva#javascript-api-unstable-dev-api).

Some of the functions are also described in the [JavaScript API documntation](https://git-r3lab.uni.lu/piotr.gawron/minerva#javascript-api-unstable-dev-api).

###### ServerConnector object

Minerva also exposes variable called `ServerConnector` to the global scope (therefore you can explore it by typing `ServerConnector` in the browser developers console). It provides various functionality such as ability to retrieve list of models, overlays, projects, link to logo file, server address or add and modify comments, users.

###### Minerva's API

It can happen that there exists a (mainly data-related) functionality which is not available in the proxy object but is available through [Minerva's REST API](https://git-r3lab.uni.lu/piotr.gawron/minerva). In such case you can use Ajax to retrieve the data (the easiest way is probably to use jQuery's [getJSON](http://api.jquery.com/jquery.getjson/) function).




