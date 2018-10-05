require([
  'Canvas-Flowmap-Layer/CanvasFlowmapLayer',
  'esri/Graphic',
  'esri/Map',
  'esri/views/MapView',
  'dojo/domReady!'
], function(
  CanvasFlowmapLayer,
  Graphic,
  EsriMap,
  MapView
) {
  var view = new MapView({
    container: 'viewDiv',
    map: new EsriMap(),
    center: [0, 0],
    ui: {
      components: ['zoom', 'attribution', 'compass']
    }
  });

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
        // array of Graphics
        graphics: graphicsFromCsvRows,

        // information about the uniqe origin-destinatino fields and geometries
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

      function step() {
        view.center = [view.center.longitude -= 1, view.center.latitude];
        requestAnimationFrame(step);
      }

      // get access to the CanvasFlowmapLayer's layerView to make modifications
      // of which O-D relationships are flagged for path display
      view.whenLayerView(canvasFlowmapLayer).then(function(layerView) {
        // automatically select a few ORIGIN locations for path display
        // in order to demonstrate the flowmap functionality,
        // without being overwhelming and showing all O-D relationships
          
        // Alexandria
        layerView.selectGraphicsForPathDisplayById('s_city_id', 1, true, 'SELECTION_NEW');

        requestAnimationFrame(step);
      });
    }
  });
});
