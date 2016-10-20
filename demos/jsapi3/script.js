require([
  'Canvas-Flowline-Layer/jsapi3/CanvasFlowlineLayer',

  'esri/layers/CSVLayer',
  'esri/map',

  'local-resources/config',

  'dojo/domReady!'
], function(
  CanvasFlowlineLayer,

  CSVLayer,
  Map,

  config
) {
  var map = new Map('map', {
    basemap: 'dark-gray-vector',
    center: [0, 0],
    zoom: 1
  });

  map.on('load', function() {
    var cityToCityLayer = new CanvasFlowlineLayer({
      id: 'cityToCityLayer',
      map: map, // TODO: map.addLayer(cityToCityLayer); instead of passing in map reference
      originAndDestinationFieldIds: config.cityToCityLayer.originAndDestinationFieldIds,
      originCircleProperties: config.cityToCityLayer.originCircleProperties,
      originHighlightCircleProperties: config.cityToCityLayer.originHighlightCircleProperties,
      destinationCircleProperties: config.cityToCityLayer.destinationCircleProperties,
      destinationHighlightCircleProperties: config.cityToCityLayer.destinationHighlightCircleProperties,
      pathProperties: config.cityToCityLayer.pathProperties
    });

    // NOTE: the CSVLayer is only used now to fetch and parse the CSV data
    // we could have also used the d3js to load the CSV data
    var csvData = new CSVLayer('../../csv/Flowline_Cities.csv', {
      fields: config.cityToCityLayer.csvAttributeDefinitions,
      outFields: config.cityToCityLayer.csvAttributeDefinitions.map(function(attrDef) {
        return attrDef.name;
      }),
      latitudeFieldName: 's_lat',
      longitudeFieldName: 's_lon'
    });

    map.addLayer(csvData);

    csvData.on('update-end', function() {
      if (csvData.graphics.length) {
        // remove the temporary CSVLayer from the map
        map.removeLayer(csvData);

        // add all graphics to the canvas flowline layer
        cityToCityLayer.addGraphics(csvData.graphics);
        // show the canvas flowline layer
        cityToCityLayer.show();
      }
    });

    cityToCityLayer.on('click', function(evt) {
      // evt.sharedOriginOrDestinationGraphics:
      //  - an array of all graphics with the same origin OR destination unique value as what was clicked on
      //  - mark shared origin or destination graphics as "selected"
      //  - "selected" graphics inform the canvas flowline layer which flow line paths to display
      cityToCityLayer.selectGraphicsForPathDisplay(evt.sharedOriginOrDestinationGraphics, 'SELECTION_ADD');
    });
  });

});
