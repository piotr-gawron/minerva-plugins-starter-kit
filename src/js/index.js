require('../css/styles.css');

const pluginName = 'starter-kit';
const pluginVersion = '1.0.0';

const globals = {
    selected: [],
    allBioEntities: [],
    pickedRandomly: undefined
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
    container.append('<button type="button" class="btn-focus btn btn-primary btn-default btn-block">Focus</button>');
    container.append('<button type="button" class="btn-highlight btn btn-primary btn-default btn-block">Highlight</button>');

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
    container.append('<h4>Query UniProt API</h4>');
    container.append('<button type="button" class="btn-uniprot btn btn-primary btn-default btn-block">Retrieve from UniProt</button>');
    container.append(`
        <div class="panel panel-default panel-uniprot">
            <div class="panel-heading">Uniprot records for the picked object</div>
            <div class="panel-body">
                <code></code>
            </div>
        </div>
    `);

    container.append('<hr>');
    container.append('<h4>Query Minerva API</h4>');
    container.append(`
        <form class="form-horizontal">
            <div class="form-group">
                <label class="col-sm-2 control-label">Address</label>
                <div class="col-sm-10">
                    <input class="input-minerva-address form-control" placeholder="https://minerva-dev.lcsb.uni.lu/minerva">
                </div>
            </div>
            <div class="form-group">
                <label class="col-sm-2 control-label">Project ID</label>
                <div class="col-sm-10">
                    <input class="input-minerva-projectid form-control" placeholder="sample2">
                </div>
            </div>                        
        </form>
        <button type="button" class="btn-minerva btn btn-primary btn-default btn-block">Retrieve from Minerva</button>
        <div class="panel panel-default panel-minerva">
            <div class="panel-heading">Names of elements</div>
            <div class="panel-body">                
            </div>
        </div>
    `);

    container.find('.btn-highlight').on('click', () => highlightSelected() );
    container.find('.btn-focus').on('click', () => focusOnSelected() );
    container.find('.btn-pick-random').on('click', () => pickRandom() );
    container.find('.btn-highlight-random').on('click', () => highlightSelected(true) );
    container.find('.btn-focus-random').on('click', () => focusOnSelected(true) );
    container.find('.btn-uniprot').on('click', () => retrieveUniprot() );
    container.find('.btn-minerva').on('click', () => retrieveMinerva() );
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
        globals.pickedRandomly = globals.allBioEntities[Math.floor(Math.random() * globals.allBioEntities.length)];

        let html = `${globals.pickedRandomly.constructor.name} - `;
        if (globals.pickedRandomly.constructor.name === 'Alias') html += `${globals.pickedRandomly.getElementId()} - ${globals.pickedRandomly.getName()}`;
        else html += `${globals.pickedRandomly.getReactionId()}`;
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

function highlightSelected(pickedRandomly = false) {

    const highlightDefs = [];

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
        globals.selected.forEach(e => {
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

function focusOnSelected(pickedRandomly = false) {

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

    if (!pickedRandomly && globals.selected.length > 0)  focus(globals.selected[0]);
    if (pickedRandomly && globals.pickedRandomly) focus(globals.pickedRandomly);
}

function retrieveUniprot() {
    const query = pluginContainer.find('.panel-randomly-picked .panel-body').text();
    $.ajax({
        type: 'GET',
        url: 'https://www.uniprot.org/uniprot/?query=' + query + '&sort=score&columns=id,entry%20name,reviewed,protein%20names,3d,genes,organism,length&format=tab&limit=10'
    }).then(function(result){
        pluginContainer.find('.panel-uniprot .panel-body code').text(result);

    })
}

function retrieveMinerva() {
    const address = pluginContainer.find('.input-minerva-address').val();
    const projectId = pluginContainer.find('.input-minerva-projectid').val();

    $.getJSON(`${address}/api/doLogin`).then(() => {
        return $.getJSON(`${address}/api/projects/${projectId}/models/`);
    }).then((models) => {
        console.log('models');
        pluginContainer.find('.panel-minerva .panel-body').text(models);
    })
}
