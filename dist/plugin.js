(function(){function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s}return e})()({1:[function(require,module,exports){
'use strict';
// For more information about browser field, check out the browser field at https://github.com/substack/browserify-handbook#browser-field.

var styleElementsInsertedAtTop = [];

var insertStyleElement = function(styleElement, options) {
    var head = document.head || document.getElementsByTagName('head')[0];
    var lastStyleElementInsertedAtTop = styleElementsInsertedAtTop[styleElementsInsertedAtTop.length - 1];

    options = options || {};
    options.insertAt = options.insertAt || 'bottom';

    if (options.insertAt === 'top') {
        if (!lastStyleElementInsertedAtTop) {
            head.insertBefore(styleElement, head.firstChild);
        } else if (lastStyleElementInsertedAtTop.nextSibling) {
            head.insertBefore(styleElement, lastStyleElementInsertedAtTop.nextSibling);
        } else {
            head.appendChild(styleElement);
        }
        styleElementsInsertedAtTop.push(styleElement);
    } else if (options.insertAt === 'bottom') {
        head.appendChild(styleElement);
    } else {
        throw new Error('Invalid value for parameter \'insertAt\'. Must be \'top\' or \'bottom\'.');
    }
};

module.exports = {
    // Create a <link> tag with optional data attributes
    createLink: function(href, attributes) {
        var head = document.head || document.getElementsByTagName('head')[0];
        var link = document.createElement('link');

        link.href = href;
        link.rel = 'stylesheet';

        for (var key in attributes) {
            if ( ! attributes.hasOwnProperty(key)) {
                continue;
            }
            var value = attributes[key];
            link.setAttribute('data-' + key, value);
        }

        head.appendChild(link);
    },
    // Create a <style> tag with optional data attributes
    createStyle: function(cssText, attributes, extraOptions) {
        extraOptions = extraOptions || {};

        var style = document.createElement('style');
        style.type = 'text/css';

        for (var key in attributes) {
            if ( ! attributes.hasOwnProperty(key)) {
                continue;
            }
            var value = attributes[key];
            style.setAttribute('data-' + key, value);
        }

        if (style.sheet) { // for jsdom and IE9+
            style.innerHTML = cssText;
            style.sheet.cssText = cssText;
            insertStyleElement(style, { insertAt: extraOptions.insertAt });
        } else if (style.styleSheet) { // for IE8 and below
            insertStyleElement(style, { insertAt: extraOptions.insertAt });
            style.styleSheet.cssText = cssText;
        } else { // for Chrome, Firefox, and Safari
            style.appendChild(document.createTextNode(cssText));
            insertStyleElement(style, { insertAt: extraOptions.insertAt });
        }
    }
};

},{}],2:[function(require,module,exports){
var css = ".starter-kit-container {\n  padding: 10px;\n  background-color: #bada55;\n}\n.btn-uniprot,\n.btn-pick-random,\n.btn-minerva {\n  margin-bottom: 5px;\n}\n"; (require("browserify-css").createStyle(css, { "href": "src\\css\\styles.css" }, { "insertAt": "bottom" })); module.exports = css;
},{"browserify-css":1}],3:[function(require,module,exports){
'use strict';

require('../css/styles.css');

var pluginName = 'starter-kit';
var pluginVersion = '1.0.0';

var minervaProxyServer = 'https://minerva-dev.lcsb.uni.lu/minerva-proxy/';

var globals = {
    selected: [],
    allBioEntities: [],
    pickedRandomly: undefined
};

// ******************************************************************************
// ********************* PLUGIN REGISTRATION WITH MINERVA *********************
// ******************************************************************************

var minervaProxy = void 0;
var pluginContainer = void 0;
var pluginContainerId = void 0;

var register = function register(_minerva) {

    console.log('registering ' + pluginName + ' plugin');

    $(".tab-content").css('position', 'relative');
    minervaProxy = _minerva;
    pluginContainer = $(minervaProxy.element);
    pluginContainerId = pluginContainer.attr('id');

    console.log('minerva object ', minervaProxy);
    console.log('project id: ', minervaProxy.project.data.getProjectId());
    console.log('model id: ', minervaProxy.project.data.getModels()[0].modelId);

    initPlugin();
};

var unregister = function unregister() {
    console.log('unregistering ' + pluginName + ' plugin');

    unregisterListeners();
    return deHighlightAll();
};

var getName = function getName() {
    return pluginName;
};

var getVersion = function getVersion() {
    return pluginVersion;
};

/**
 * Function provided by Minerva to register the plugin
 */
minervaDefine(function () {
    return {
        register: register,
        unregister: unregister,
        getName: getName,
        getVersion: getVersion
    };
});

function initPlugin() {
    registerListeners();
    initMainPageStructure();
}

function registerListeners() {
    minervaProxy.project.map.addListener({
        dbOverlayName: "search",
        type: "onSearch",
        callback: searchListener
    });
}

function unregisterListeners() {
    minervaProxy.project.map.removeAllListeners();
}

// ****************************************************************************
// ********************* MINERVA INTERACTION*********************
// ****************************************************************************


function deHighlightAll() {
    return minervaProxy.project.map.getHighlightedBioEntities().then(function (highlighted) {
        return minervaProxy.project.map.hideBioEntity(highlighted);
    });
}

// ****************************************************************************
// ********************* PLUGIN STRUCTURE AND INTERACTION*********************
// ****************************************************************************

function initMainPageStructure() {

    var container = $('<div class="' + pluginName + '-container"></div>').appendTo(pluginContainer);
    container.append('\n        <div class="panel panel-default panel-events">\n            <div class="panel-heading">Events (Select an element in the map)</div>\n            <div class="panel-body">                \n            </div>\n        </div>\n    ');
    container.append('<button type="button" class="btn-focus btn btn-primary btn-default btn-block">Focus</button>');
    container.append('<button type="button" class="btn-highlight btn btn-primary btn-default btn-block">Highlight</button>');

    container.append('<hr>');
    container.append('<button type="button" class="btn-pick-random btn btn-primary btn-default btn-block">Retrieve random object from map</button>');
    container.append('\n        <div class="panel panel-default panel-randomly-picked">\n            <div class="panel-heading">Randomly picked object</div>\n            <div class="panel-body">                \n            </div>\n        </div>\n    ');
    container.append('<button type="button" class="btn-focus-random btn btn-primary btn-default btn-block">Focus</button>');
    container.append('<button type="button" class="btn-highlight-random btn btn-primary btn-default btn-block">Highlight</button>');

    container.append('<hr>');
    container.append('<h4>Query UniProt API</h4>');
    container.append('<button type="button" class="btn-uniprot btn btn-primary btn-default btn-block">Retrieve from UniProt</button>');
    container.append('\n        <div class="panel panel-default panel-uniprot">\n            <div class="panel-heading">Uniprot records for the picked object</div>\n            <div class="panel-body">\n                <code></code>\n            </div>\n        </div>\n    ');

    container.append('<hr>');
    container.append('<h4>Query Minerva API</h4>');
    container.append('\n        <form class="form-horizontal">\n            <div class="form-group">\n                <label class="col-sm-2 control-label">Address</label>\n                <div class="col-sm-10">\n                    <input class="input-minerva-address form-control" value="https://minerva-dev.lcsb.uni.lu/minerva">\n                </div>\n            </div>\n            <div class="form-group">\n                <label class="col-sm-2 control-label">Project ID</label>\n                <div class="col-sm-10">\n                    <input class="input-minerva-projectid form-control" value="sample2">\n                </div>\n            </div>                        \n        </form>\n        <button type="button" class="btn-minerva btn btn-primary btn-default btn-block">Retrieve from Minerva</button>\n        <div class="panel panel-default panel-minerva">\n            <div class="panel-heading">Names of elements</div>\n            <div class="panel-body">                \n            </div>\n        </div>\n    ');

    container.find('.btn-highlight').on('click', function () {
        return highlightSelected();
    });
    container.find('.btn-focus').on('click', function () {
        return focusOnSelected();
    });
    container.find('.btn-pick-random').on('click', function () {
        return pickRandom();
    });
    container.find('.btn-highlight-random').on('click', function () {
        return highlightSelected(true);
    });
    container.find('.btn-focus-random').on('click', function () {
        return focusOnSelected(true);
    });
    container.find('.btn-uniprot').on('click', function () {
        return retrieveUniprot();
    });
    container.find('.btn-minerva').on('click', function () {
        return retrieveMinerva();
    });
}

function searchListener(entites) {
    globals.selected = entites[0];

    var str = '';
    if (globals.selected.length > 0) {
        globals.selected.forEach(function (e) {
            if (e.constructor.name === 'Alias') str += '<div>' + e.getName() + ' - ' + e.getElementId() + '</div>';
        });
    }
    pluginContainer.find('.panel-events .panel-body').html(str);
}

function pickRandom() {

    function pick() {
        globals.pickedRandomly = globals.allBioEntities[Math.floor(Math.random() * globals.allBioEntities.length)];

        var html = globals.pickedRandomly.constructor.name + ' - ';
        if (globals.pickedRandomly.constructor.name === 'Alias') html += globals.pickedRandomly.getElementId() + ' - ' + globals.pickedRandomly.getName();else html += '' + globals.pickedRandomly.getReactionId();
        pluginContainer.find('.panel-randomly-picked .panel-body').html(html);
    }
    if (globals.allBioEntities.length > 0) {
        pick();
    } else {
        minervaProxy.project.data.getAllBioEntities().then(function (bioEntities) {
            globals.allBioEntities = bioEntities;
            pick();
        });
    }
}

function highlightSelected() {
    var pickedRandomly = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;


    var highlightDefs = [];

    if (pickedRandomly) {
        if (globals.pickedRandomly) {
            highlightDefs.push({
                element: {
                    id: globals.pickedRandomly.id,
                    modelId: globals.pickedRandomly.getModelId(),
                    type: globals.pickedRandomly.constructor.name.toUpperCase()
                },
                type: "SURFACE",
                options: {
                    color: '#00FF00',
                    opacity: 0.5
                }
            });
        }
    } else {
        globals.selected.forEach(function (e) {
            highlightDefs.push({
                element: {
                    id: e.id,
                    modelId: e.getModelId(),
                    type: "ALIAS"
                },
                type: "ICON"
            });
        });
    }

    minervaProxy.project.map.showBioEntity(highlightDefs);
}

function focusOnSelected() {
    var pickedRandomly = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;


    function focus(entity) {
        if (entity.constructor.name === 'Alias') {
            minervaProxy.project.map.fitBounds({
                modelId: entity.getModelId(),
                x1: entity.getX(),
                y1: entity.getY(),
                x2: entity.getX() + entity.getWidth(),
                y2: entity.getY() + entity.getHeight()
            });
        } else {
            minervaProxy.project.map.fitBounds({
                modelId: entity.getModelId(),
                x1: entity.getCenter().x,
                y1: entity.getCenter().y,
                x2: entity.getCenter().x,
                y2: entity.getCenter().y
            });
        }
    }

    if (!pickedRandomly && globals.selected.length > 0) focus(globals.selected[0]);
    if (pickedRandomly && globals.pickedRandomly) focus(globals.pickedRandomly);
}

function retrieveUniprot() {
    var query = pluginContainer.find('.panel-randomly-picked .panel-body').text();
    $.ajax({
        type: 'GET',
        url: 'https://www.uniprot.org/uniprot/?query=' + query + '&sort=score&columns=id,entry%20name,reviewed,protein%20names,3d,genes,organism,length&format=tab&limit=10'
    }).then(function (result) {
        pluginContainer.find('.panel-uniprot .panel-body code').text(result);
    });
}

function retrieveMinerva() {
    var address = pluginContainer.find('.input-minerva-address').val();
    var projectId = pluginContainer.find('.input-minerva-projectid').val();

    $.ajax({
        type: 'GET',
        url: minervaProxyServer + '?url=' + address + '/api/projects/' + projectId + '/models/',
        dataType: 'json'
    }).then(function (models) {
        console.log('Retrived models from ' + minervaProxyServer, models);
        var firstModelId = models[0].idObject;
        return $.ajax({
            type: 'GET',
            url: minervaProxyServer + '?url=' + address + '/api/projects/' + projectId + '/models/' + firstModelId + '/bioEntities/elements/',
            dataType: 'json'
        });
    }).then(function (elements) {
        console.log('Retrived elements from ' + minervaProxyServer, elements);
        var names = '';
        elements.forEach(function (element) {
            names += element.name + '<br/>';
        });
        pluginContainer.find('.panel-minerva .panel-body').html(names);
    });
}

},{"../css/styles.css":2}]},{},[3]);
