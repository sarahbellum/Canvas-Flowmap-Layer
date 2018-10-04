require([
  'Canvas-Flowmap-Layer/CanvasFlowmapLayer',
  'esri/Graphic',
  'esri/Map',
  'esri/views/MapView',
  'esri/Basemap',
  'esri/layers/TileLayer',
  'dojo/domReady!'
], function(
  CanvasFlowmapLayer,
  Graphic,
  EsriMap,
  MapView,
  Basemap,
  TileLayer
) {
  var view = new MapView({
    container: 'viewDiv',
    map: new EsriMap({
      // use a basemap with an Albers 102003 map projection
      basemap: new Basemap({
        baseLayers: [
          new TileLayer({
            url: 'https://tiles.arcgis.com/tiles/nGt4QxSblgDfeJn9/arcgis/rest/services/Dark_Gray_Albers_North_America_Base/MapServer'
          })
        ]
      })
    }),
    extent: {
      xmin: -2749287,
      ymin: -1983352,
      xmax: 3306971,
      ymax: 2605315,
      spatialReference: {
        wkid: 102003
      }
    },
    ui: {
      components: ['zoom', 'attribution', 'compass']
    }
  });

  view.when(function() {
    view.watch('extent', function() {
      console.log(arguments[0].toJSON())
    })
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

        // get access to the CanvasFlowmapLayer's layerView to make modifications
        // of which O-D relationships are flagged for path display
        view.whenLayerView(canvasFlowmapLayer).then(function(layerView) {
          // automatically select a few ORIGIN locations for path display
          // in order to demonstrate the flowmap functionality,
          // without being overwhelming and showing all O-D relationships

          // Chicago
          layerView.selectGraphicsForPathDisplayById('s_city_id', 128, true, 'SELECTION_NEW');

          // San Bernandino
          layerView.selectGraphicsForPathDisplayById('s_city_id', 593, true, 'SELECTION_ADD');
        });
      }
    });
  });
});
