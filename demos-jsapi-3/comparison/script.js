require([
  'Canvas-Flowmap-Layer/CanvasFlowmapLayer',
  'esri/graphic',
  'esri/map',
  'dojo/on',
  'dojo/domReady!'
], function(
  CanvasFlowmapLayer,
  Graphic,
  Map,
  on
) {
  // establish references to form elements in the controls card
  var oneToManyLayerButton = document.getElementById('oneToManyLayerButton');
  var manyToOneLayerButton = document.getElementById('manyToOneLayerButton');
  var oneToOneLayerButton = document.getElementById('oneToOneLayerButton');
  var pathAnimationButton = document.getElementById('pathAnimationButton');
  var pathAnimationStyleSelect = document.getElementById('pathAnimationStyleSelect');
  var pathAnimationDurationInput = document.getElementById('pathAnimationDurationInput');
  var userInteractionSelect = document.getElementById('userInteractionSelect');
  var pathSelectionTypeSelect = document.getElementById('pathSelectionTypeSelect');

  var map = new Map('map', {
    basemap: 'dark-gray-vector',
    center: [22, 14],
    zoom: 2
  });

  map.on('load', function() {
    var oneToManyLayer = new CanvasFlowmapLayer({
      // JSAPI GraphicsLayer constructor properties
      id: 'oneToManyLayer',
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

    var manyToOneLayer = new CanvasFlowmapLayer({
      id: 'manyToOneLayer',
      visible: false,
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
      pathDisplayMode: 'selection',
      wrapAroundCanvas: true,
      animationStarted: true
    });

    var oneToOneLayer = new CanvasFlowmapLayer({
      id: 'oneToOneLayer',
      visible: false,
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
      pathDisplayMode: 'selection',
      wrapAroundCanvas: true,
      animationStarted: true
    });

    map.addLayers([oneToManyLayer, manyToOneLayer, oneToOneLayer]);

    createGraphicsFromCsv('../csv-data/Flowmap_Cities_one_to_many.csv', oneToManyLayer);
    createGraphicsFromCsv('../csv-data/Flowmap_Cities_many_to_one.csv', manyToOneLayer);
    createGraphicsFromCsv('../csv-data/Flowmap_Cities_one_to_one.csv', oneToOneLayer);

    // here we use Papa Parse to load and read the CSV data
    // we could have also used another library like D3js to do the same
    function createGraphicsFromCsv(csvFilePath, canvasLayer) {
      Papa.parse(csvFilePath, {
        download: true,
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: function(results) {
          var csvGraphics = results.data.map(function(datum) {
            return new Graphic({
              geometry: {
                x: datum.s_lon,
                y: datum.s_lat,
                spatialReference: {
                  wkid: 4326
                }
              },
              attributes: datum
            });
          });

          // add all graphics to the canvas flowmap layer
          canvasLayer.addGraphics(csvGraphics);
        }
      });
    }

    // populate animation easing options for select drop-down

    var tweenEasingFamilies = oneToManyLayer.getAnimationEasingOptions();
    Object.keys(tweenEasingFamilies).forEach(function(family) {
      tweenEasingFamilies[family].types.forEach(function(type) {
        var option = document.createElement('option');
        option.value = family + ',' + type;
        option.text = (type === 'None') ? family : (family + ', ' + type);

        if (
          family === oneToManyLayer.DEFAULT_ANIMATION_EASING_FAMILY &&
          type === oneToManyLayer.DEFAULT_ANIMATION_EASING_TYPE
        ) {
          option.selected = true;
        }

        pathAnimationStyleSelect.add(option);
      });
    });

    // establish each layer's click and mouse-over handlers to demonstrate the flowmap functionality
    var clickListeners = [];
    clickListeners.push(on.pausable(oneToManyLayer, 'click', handleLayerInteraction));
    clickListeners.push(on.pausable(manyToOneLayer, 'click', handleLayerInteraction));
    clickListeners.push(on.pausable(oneToOneLayer, 'click', handleLayerInteraction));
    var mouseoverListeners = [];
    mouseoverListeners.push(on.pausable(oneToManyLayer, 'mouse-over', handleLayerInteraction));
    mouseoverListeners.push(on.pausable(manyToOneLayer, 'mouse-over', handleLayerInteraction));
    mouseoverListeners.push(on.pausable(oneToOneLayer, 'mouse-over', handleLayerInteraction));
    // begin the demo with all mouse-over listeners paused (turned off)
    mouseoverListeners.forEach(function(listener) {
      listener.pause();
    });

    function handleLayerInteraction(evt) {
      var canvasLayer = evt.graphic.getLayer();
      // evt.isOriginGraphic: Boolean
      // evt.sharedOriginGraphics: Array of all ORIGIN graphics with the same ORIGIN ID field
      // evt.sharedDestinationGraphics: Array of all ORIGIN graphics with the same DESTINATION ID field

      // - you can mark shared origin or destination graphics as selected for path display using these modes:
      //   - 'SELECTION_NEW', 'SELECTION_ADD', or 'SELECTION_SUBTRACT'
      // - these selected graphics inform the canvas flowmap layer which paths to display

      // NOTE: if the layer's pathDisplayMode was originally set to "all",
      // this manual selection will override the displayed paths

      if (evt.isOriginGraphic) {
        canvasLayer.selectGraphicsForPathDisplay(evt.sharedOriginGraphics, pathSelectionTypeSelect.value);
      } else {
        canvasLayer.selectGraphicsForPathDisplay(evt.sharedDestinationGraphics, pathSelectionTypeSelect.value);
      }
    }

    setTimeout(function() {
      // show the controls card after a brief delay
      document.getElementById('controlsPanelCard').classList.remove('off');

      // automatically select some graphics for path display to demonstrate the flowmap functionality,
      // without the user having to first click on the layer
      oneToManyLayer.selectGraphicsForPathDisplayById('s_city_id', 562, true, 'SELECTION_NEW');
      manyToOneLayer.selectGraphicsForPathDisplayById('e_city_id', 562, false, 'SELECTION_NEW');
      oneToOneLayer.selectGraphicsForPathDisplayById('e_city_id', 562, false, 'SELECTION_NEW');
    }, 3000);

    // establish actions for form elements in the controls card
    oneToManyLayerButton.addEventListener('click', toggleActiveLayer);
    manyToOneLayerButton.addEventListener('click', toggleActiveLayer);
    oneToOneLayerButton.addEventListener('click', toggleActiveLayer);

    function toggleActiveLayer(evt) {
      oneToManyLayerButton.classList.add('btn-clear');
      manyToOneLayerButton.classList.add('btn-clear');
      oneToOneLayerButton.classList.add('btn-clear');

      oneToManyLayer.hide();
      manyToOneLayer.hide();
      oneToOneLayer.hide();

      map.getLayer(evt.target.id.split('Button')[0]).show();
      evt.target.classList.remove('btn-clear');
    }

    pathAnimationButton.addEventListener('click', function(evt) {
      var iconNode = evt.currentTarget.children[0];
      iconNode.classList.toggle('icon-ui-pause');
      iconNode.classList.toggle('icon-ui-red');
      iconNode.classList.toggle('icon-ui-play');
      iconNode.classList.toggle('icon-ui-green');

      toggleLayerAnimation(oneToManyLayer);
      toggleLayerAnimation(manyToOneLayer);
      toggleLayerAnimation(oneToOneLayer);
    });

    function toggleLayerAnimation(canvasLayer) {
      if (canvasLayer.animationStarted) {
        canvasLayer.stopAnimation();
      } else {
        canvasLayer.playAnimation();
      }
    }

    pathAnimationStyleSelect.addEventListener('change', function(evt) {
      var optionValueToArray = evt.target.value.split(',');
      var easingFamily = optionValueToArray[0];
      var easingType = optionValueToArray[1];

      oneToManyLayer.setAnimationEasing(easingFamily, easingType);
      manyToOneLayer.setAnimationEasing(easingFamily, easingType);
      oneToOneLayer.setAnimationEasing(easingFamily, easingType);
    });

    pathAnimationDurationInput.addEventListener('input', function(evt) {
      oneToManyLayer.setAnimationDuration(evt.target.value);
      manyToOneLayer.setAnimationDuration(evt.target.value);
      oneToOneLayer.setAnimationDuration(evt.target.value);
    });

    // toggle click or mouse-over listeners as either paused or resumed
    userInteractionSelect.addEventListener('change', function(evt) {
      if (evt.target.value === 'click') {
        clickListeners.forEach(function(clickListener) {
          clickListener.resume();
        });
        mouseoverListeners.forEach(function(mouseoverListener) {
          mouseoverListener.pause();
        });
      } else {
        clickListeners.forEach(function(clickListener) {
          clickListener.pause();
        });
        mouseoverListeners.forEach(function(mouseoverListener) {
          mouseoverListener.resume();
        });
      }
    });
  });
});
