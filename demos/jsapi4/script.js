require([
  // 'Canvas-Flowline-Layer/jsapi4/CanvasFlowlineLayer',

  'esri/Map',
  'esri/views/MapView',

  // 'local-resources/config',

  'dojo/domReady!'
], function(
  // CanvasFlowlineLayer,

  Map,
  MapView

  // config
) {
  var map = new Map({
    basemap: 'dark-gray-vector'
  });

  var view = new MapView({
    container: 'viewDiv',
    map: map,
    zoom: 1,
    center: [0, 0]
  });
});
