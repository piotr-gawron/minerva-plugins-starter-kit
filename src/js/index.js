require('../css/styles.css');

const pluginName = 'starter-kit';
const pluginVersion = '1.0.0';

const globals = {
    selected: [],
    allBioEntities: [],
    picked: undefined
};

// ******************************************************************************
// ********************* PLUGIN REGISTRATION WITH MINERVA *********************
// ******************************************************************************

let minervaProxy;
let pluginContainer;
let pluginContainerId;

const register = function(_minerva) {

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

const unregister = function () {
    console.log('unregistering ' + pluginName + ' plugin');

    unregisterListeners();
    return deHighlightAll();
};

const getName = function() {
    return pluginName;
};

const getVersion = function() {
    return pluginVersion;
};

/**
 * Function provided by Minerva to register the plugin
 */
minervaDefine(function (){
    return {
        register: register,
        unregister: unregister,
        getName: getName,
        getVersion: getVersion
    }
});

function initPlugin () {
    registerListeners();
    initMainPageStructure();
}

function registerListeners(){
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


function deHighlightAll(){
    return minervaProxy.project.map.getHighlightedBioEntities().then( highlighted => minervaProxy.project.map.hideBioEntity(highlighted) );
}

// ****************************************************************************
// ********************* PLUGIN STRUCTURE AND INTERACTION*********************
// ****************************************************************************

function initMainPageStructure(){

    const container = $('<div class="' + pluginName + '-container"></div>').appendTo(pluginContainer);
    container.append(`
        <div class="panel panel-default panel-events">
            <div class="panel-heading">Events (Select an element in the map)</div>
            <div class="panel-body">                
            </div>
        </div>
    `);
    container.append('<button type="button" class="btn-highlight btn btn-primary btn-default btn-block">Highlight</button>');
    container.append('<button type="button" class="btn-focus btn btn-primary btn-default btn-block">Focus</button>');

    container.append('<hr>');
    container.append('<button type="button" class="btn-pick-random btn btn-primary btn-default btn-block">Retrieve random object from map</button>');
    container.append(`
        <div class="panel panel-default panel-randomly-picked">
            <div class="panel-heading">Randomly picked object</div>
            <div class="panel-body">                
            </div>
        </div>
    `);
    container.append('<button type="button" class="btn-focus-random btn btn-primary btn-default btn-block">Focus</button>');
    container.append('<button type="button" class="btn-highlight-random btn btn-primary btn-default btn-block">Highlight</button>');

    container.append('<hr>');
    container.append('<button type="button" class="btn-uniprot btn btn-primary btn-default btn-block">Retrieve from UniProt</button>');
    container.append(`
        <div class="panel panel-default panel-uniprot">
            <div class="panel-heading">Uniprot records for the picked object</div>
            <div class="panel-body">
                <code></code>
            </div>
        </div>
    `);

    container.find('.btn-highlight').on('click', () => highlightSelected() );
    container.find('.btn-focus').on('click', () => focusOnSelected() );
    container.find('.btn-pick-random').on('click', () => pickRandom() );
    container.find('.btn-highlight-random').on('click', () => highlightSelected(true) );
    container.find('.btn-focus-random').on('click', () => focusOnSelected(true) );
    container.find('.btn-uniprot').on('click', () => retrieveUniprot() );
}

function searchListener(entites) {
    globals.selected = entites[0];

    let str = '';
    if (globals.selected.length > 0) {
        globals.selected.forEach(e => {if (e.constructor.name === 'Alias') str += `<div>${e.getName()} - ${e.getElementId()}</div>`});
    }
    pluginContainer.find('.panel-events .panel-body').html(str);
}

function pickRandom() {

    function pick(){
        globals.picked = globals.allBioEntities[Math.floor(Math.random() * globals.allBioEntities.length)];

        let html = `${globals.picked.constructor.name} - `;
        if (globals.picked.constructor.name === 'Alias') html += `${globals.picked.getElementId()} - ${globals.picked.getName()}`;
        else html += `${globals.picked.getReactionId()}`;
        pluginContainer.find('.panel-randomly-picked .panel-body').html(html);
    }
    if (globals.allBioEntities.length > 0) {
        pick();
    }
    else {
        minervaProxy.project.data.getAllBioEntities().then(function(bioEntities) {
            globals.allBioEntities = bioEntities;
            pick();
        });
    }
}

function highlightSelected(picked = false) {

    const highlightDefs = [];

    if (picked) {
        if (globals.picked) {
            highlightDefs.push({
                element: {
                    id: globals.picked.id,
                    modelId: globals.picked.getModelId(),
                    type: globals.picked.constructor.name.toUpperCase()
                },
                type: "SURFACE",
                options: {
                    color: '#00FF00',
                    opacity: 0.5
                }
            });
        }
    } else {
        globals.selected.forEach(e => {
            highlightDefs.push({
                element: {
                    id: e.id,
                    modelId: e.getModelId(),
                    type: "ALIAS"
                },
                type: "SURFACE",
                options: {
                    color: '#FF0000',
                    opacity: 0.5
                }
            });
        });
    }

    minervaProxy.project.map.showBioEntity(highlightDefs);
}

function focusOnSelected(picked = false) {

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
                y2: entity.getCenter().x
            });
        }
    }

    if (!picked && globals.selected.length > 0)  focus(globals.selected[0]);
    if (picked && globals.picked) focus(globals.picked);
}

function retrieveUniprot() {

    const query = pluginContainer.find('.panel-uniprot .panel-randomly-picked').text();
    $.ajax({
        type: 'GET',
        url: 'https://www.uniprot.org/uniprot/?query=' + query + '&sort=score&columns=id,entry%20name,reviewed,protein%20names,3d,genes,organism,length&format=tab&limit=10'
    }).then(function(result){
        pluginContainer.find('.panel-uniprot .panel-body code').html(JSON.stringify(result));

    })
}
