require([
  'Canvas-Flowmap-Layer/CanvasFlowmapLayer',
  'esri/Graphic',
  'esri/Map',
  'esri/views/MapView',
  'esri/widgets/Compass',
  'dojo/domReady!'
], function(
  CanvasFlowmapLayer,
  Graphic,
  EsriMap,
  MapView,
  Compass
) {
  var view = new MapView({
    container: 'viewDiv',
    map: new EsriMap({
      basemap: 'dark-gray-vector'
    }),
    zoom: 2,
    center: [29.94999589, 31.20001935]
  });

  view.ui.add(new Compass({
    view: view
  }), 'top-left');

  view.when(function() {
    // here we use Papa Parse to load and read the CSV data
    // we could have also used another library like D3js to do the same
    // Papa.parse('../csv-data/Flowmap_Cities_one_to_one.csv', {
    Papa.parse('../csv-data/Flowmap_Cities_one_to_many.csv', {
      download: true,
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: function(results) {
        var graphicsFromCsvRows = results.data.map(function(datum) {
          return new Graphic({
            geometry: {
              type: 'point',
              longitude: datum.s_lon,
              latitude: datum.s_lat
            },
            attributes: datum
          });
        });

        var canvasFlowmapLayer = new CanvasFlowmapLayer({
          graphics: graphicsFromCsvRows,
          originAndDestinationFieldIds: {
            originUniqueIdField: 's_city_id',
            originGeometry: {
              x: 's_lon',
              y: 's_lat',
              spatialReference: {
                wkid: 4326
              }
            },
            destinationUniqueIdField: 'e_city_id',
            destinationGeometry: {
              x: 'e_lon',
              y: 'e_lat',
              spatialReference: {
                wkid: 4326
              }
            }
          }
        });

        view.map.layers.add(canvasFlowmapLayer);

        // get access to the CanvasFlowmapLayer's layerView to make modifications
        // of which O-D relationships are flagged for path display
        view.whenLayerView(canvasFlowmapLayer).then(function(layerView) {
          // automatically select a few ORIGIN locations for path display
          // in order to demonstrate the flowmap functionality,
          // without being overwhelming and showing all O-D relationships

          // Reykjavík
          layerView.selectGraphicsForPathDisplayById('s_city_id', 562, true, 'SELECTION_NEW');
          
          // Alexandria
          // layerView.selectGraphicsForPathDisplayById('s_city_id', 1, true, 'SELECTION_ADD');

          // Tokyo
          layerView.selectGraphicsForPathDisplayById('s_city_id', 642, true, 'SELECTION_ADD');

          // TODO: should this method be on the layer instead of the layerView?
          // layer.selectGraphicsForPathDisplayById(...)
          // layer.selectGraphicsForPathDisplay(...)
        });

        // TODO: in JSAPI v4 this custom layer needs to be able to support a view.hitTest
        // https://developers.arcgis.com/javascript/latest/api-reference/esri-views-MapView.html#hitTest

        // NOTE: in JSAPI v3 we just wired up a click listener like so:

        // canvasFlowmapLayer.on('click', function(evt) {
        //   // evt.sharedOriginGraphics: array of all ORIGIN graphics with the same ORIGIN ID field
        //   // evt.sharedDestinationGraphics: array of all ORIGIN graphics with the same DESTINATION ID field
        //   //  - you can mark shared origin or destination graphics as selected for path display using these modes:
        //   //    - 'SELECTION_NEW', 'SELECTION_ADD', or 'SELECTION_SUBTRACT'
        //   //  - these selected graphics inform the canvas flowmap layer which paths to display
      
        //   // NOTE: if the layer's pathDisplayMode was originally set to "all",
        //   // this manual selection will override the displayed paths
        //   if (evt.sharedOriginGraphics.length) {
        //     canvasFlowmapLayer.selectGraphicsForPathDisplay(evt.sharedOriginGraphics, 'SELECTION_NEW');
        //   }
        //   if (evt.sharedDestinationGraphics.length) {
        //     canvasFlowmapLayer.selectGraphicsForPathDisplay(evt.sharedDestinationGraphics, 'SELECTION_NEW');
        //   }
        // });
      }
    });
  });
});
