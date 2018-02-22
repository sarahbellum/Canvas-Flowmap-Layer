require([
  'Canvas-Flowmap-Layer/CanvasFlowmapLayer',
  'esri/Graphic',
  'esri/Map',
  'esri/views/MapView',
  'dojo/domReady!'
], function(
  CanvasFlowmapLayer,
  Graphic,
  Map,
  MapView
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

  view.when(function() {
    // here we use Papa Parse to load and read the CSV data
    // we could have also used another library like D3js to do the same
    Papa.parse('../csv-data/Flowmap_Cities_one_to_one.csv', {
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
          graphics: graphicsFromCsvRows
        });

        map.layers.add(canvasFlowmapLayer);

        // automatically select some graphics for path display to demonstrate the flowmap functionality,
        // without the user having to first click on the layer
        // cityToCityLayer.selectGraphicsForPathDisplayById('s_city_id', 562, true, 'SELECTION_NEW');
      }
    });
  });


  return;

  
  // here we use Papa Parse to load and read the CSV data
  // we could have also used another library like D3js to do the same
  var cityToCityLayer = new CanvasFlowmapLayer({
    // JSAPI GraphicsLayer constructor properties
    id: 'cityToCityLayer',
    visible: true,
    // CanvasFlowmapLayer custom constructor properties
    //  - required
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
    },
    //  - optional
    pathDisplayMode: 'selection',
    wrapAroundCanvas: true,
    animationStarted: true
  });

  cityToCityLayer.on('click', function(evt) {
    // evt.sharedOriginGraphics: array of all ORIGIN graphics with the same ORIGIN ID field
    // evt.sharedDestinationGraphics: array of all ORIGIN graphics with the same DESTINATION ID field
    //  - you can mark shared origin or destination graphics as selected for path display using these modes:
    //    - 'SELECTION_NEW', 'SELECTION_ADD', or 'SELECTION_SUBTRACT'
    //  - these selected graphics inform the canvas flowmap layer which paths to display

    // NOTE: if the layer's pathDisplayMode was originally set to "all",
    // this manual selection will override the displayed paths
    if (evt.sharedOriginGraphics.length) {
      cityToCityLayer.selectGraphicsForPathDisplay(evt.sharedOriginGraphics, 'SELECTION_NEW');
    }
    if (evt.sharedDestinationGraphics.length) {
      cityToCityLayer.selectGraphicsForPathDisplay(evt.sharedDestinationGraphics, 'SELECTION_NEW');
    }

  });
});
