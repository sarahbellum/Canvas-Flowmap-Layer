require([
  // 'Canvas-Flowline-Layer/jsapi3/CanvasFlowlineLayer',

  'esri/map',

  // 'local-resources/config',

  'dojo/domReady!'
], function(
  // CanvasFlowlineLayer,

  Map

  // config
) {
  var map = new Map('map', {
    basemap: 'dark-gray-vector',
    center: [0, 0],
    zoom: 1
  });

  // var cityToCityLayer = new CanvasFlowlineLayer({
  //   id: 'cityToCityLayer',
  //   map: map, // TODO: map.addLayer(cityToCityLayer); instead of passing in map reference
  //   originAndDestinationFieldIds: config.cityToCityLayer.originAndDestinationFieldIds,
  //   originCircleProperties: config.cityToCityLayer.originCircleProperties,
  //   originHighlightCircleProperties: config.cityToCityLayer.originHighlightCircleProperties,
  //   destinationCircleProperties: config.cityToCityLayer.destinationCircleProperties,
  //   destinationHighlightCircleProperties: config.cityToCityLayer.destinationHighlightCircleProperties,
  //   pathProperties: config.cityToCityLayer.pathProperties
  // });
});
