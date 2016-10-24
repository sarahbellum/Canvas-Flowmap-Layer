define([
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/dom',
  'dojo/dom-construct',
  'dojo/on',

  'esri/Color',
  'esri/geometry/Point',
  'esri/graphic',
  'esri/layers/GraphicsLayer',
  'esri/SpatialReference',
  'esri/symbols/SimpleMarkerSymbol'
], function(
  declare, lang, dom, domConstruct, on,
  Color, Point, Graphic, GraphicsLayer, SpatialReference, SimpleMarkerSymbol
) {
  return declare([GraphicsLayer], {
    constructor: function(options) {
      // public options/properties
      // TODO: add default values
      this.originAndDestinationFieldIds = options.originAndDestinationFieldIds || null;
      this.originCircleProperties = options.originCircleProperties || null;
      this.originHighlightCircleProperties = options.originHighlightCircleProperties || null;
      this.destinationCircleProperties = options.destinationCircleProperties || null;
      this.destinationHighlightCircleProperties = options.destinationHighlightCircleProperties || null;
      this.pathProperties = options.pathProperties || null;
      this.pathDisplayMode = options.pathDisplayMode || 'all'; // 'selection' or 'all'

      // private properties
      this._previousPanDelta = {
        x: 0,
        y: 0
      };
      this._listeners = [];
    },

    /*
    EXTENDED JSAPI GRAPHICSLAYER METHODS
    */

    // TODO: test out and finalize which GraphicsLayer methods need to be overridden

    _setMap: function() {
      var div = this.inherited(arguments);
      if (this._listeners.length) {
        this._toggleListeners();
        if (this.visible) {
          this._redrawCanvas();
        }
      } else {
        this._initListeners();
      }
      return div;
    },

    _unsetMap: function() {
      this.inherited(arguments);
      var forceOff = true;
      this._toggleListeners(forceOff);
      this._clearCanvas();
    },

    // add: function(graphic) {
    //   this.inherited(arguments);
    // },

    // clear: function() {
    //   this.inherited(arguments);
    //   this._clearCanvas();
    // },

    /*
    PRIVATE METHODS
    */

    _initListeners: function() {
      // custom handling of when setVisibility(), show(), or hide() are called on the layer
      this.on('visibility-change', lang.hitch(this, function(evt) {
        this._toggleListeners();
        if (evt.visible) {
          this._redrawCanvas();
        } else {
          this._clearCanvas();
        }
      }));

      // pausable listeners

      // when user finishes zooming or panning the map
      this._listeners.push(on.pausable(this._map, 'extent-change', lang.hitch(this, '_redrawCanvas')));

      // when user begins zooming the map
      this._listeners.push(on.pausable(this._map, 'zoom-start', lang.hitch(this, '_clearCanvas')));

      // when user is actively panning the map
      this._listeners.push(on.pausable(this._map, 'pan', lang.hitch(this, '_panCanvas')));

      // when map is resized in the browser
      this._listeners.push(on.pausable(this._map, 'resize', lang.hitch(this, '_resizeCanvas')));

      // when user interacts with a graphic by click, mouse-over, or mouse-out
      this._listeners.push(on.pausable(this, 'click,mouse-over', lang.hitch(this, function(evt) {
        var isOriginGraphic = evt.isOriginGraphic = evt.graphic.attributes._isOrigin;
        evt.sharedOriginGraphics = [];
        evt.sharedDestinationGraphics = [];

        if (isOriginGraphic) {
          // for an ORIGIN point that was interacted with,
          // make an array of all other ORIGIN graphics with the same ORIGIN ID field
          var originUniqueIdField = this.originAndDestinationFieldIds.originUniqueIdField;
          var evtGraphicOriginId = evt.graphic.attributes[originUniqueIdField];
          evt.sharedOriginGraphics = this.graphics.filter(function(graphic) {
            return graphic.attributes._isOrigin &&
              graphic.attributes[originUniqueIdField] === evtGraphicOriginId;
          });
        } else {
          // for a DESTINATION point that was interacted with,
          // make an array of all other ORIGIN graphics with the same DESTINATION ID field
          var destinationUniqueIdField = this.originAndDestinationFieldIds.destinationUniqueIdField;
          var evtGraphicDestinationId = evt.graphic.attributes[destinationUniqueIdField];
          evt.sharedDestinationGraphics = this.graphics.filter(function(graphic) {
            return graphic.attributes._isOrigin &&
              graphic.attributes[destinationUniqueIdField] === evtGraphicDestinationId;
          });
        }
      })));

      // pause or resume the pausable listeners depending on initial layer visibility
      this._toggleListeners();
    },

    _toggleListeners: function(forceOff) {
      forceOff = forceOff || !this.visible;
      var pausableMethodName = forceOff ? 'pause' : 'resume';
      this._listeners.forEach(function(listener) {
        listener[pausableMethodName]();
      });
    },

    _getCustomCanvasElement: function() {
      var canvasElementId = this.id;

      // look up if it is already in the DOM
      var canvasElement = dom.byId(canvasElementId);

      // if not in the DOM, create it only once
      if (!canvasElement) {
        canvasElement = domConstruct.create('canvas', {
          id: canvasElementId,
          width: this._map.width + 'px',
          height: this._map.height + 'px',
          style: 'position: absolute; left: 0px; top: 0px;'
        }, 'map_layer0', 'after'); // TODO: find a more flexible way to add this to the right DOM position
      }

      return canvasElement;
    },

    _clearCanvas: function() {
      // clear out previous drawn canvas content
      // e.g. when a zoom begins,
      // or just prior to changing the displayed contents in the canvas
      var canvasElement = this._getCustomCanvasElement();
      var ctx = canvasElement.getContext('2d');
      ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

      // reset canvas element position and pan delta info
      // for the next panning events
      canvasElement.style.left = '0px';
      canvasElement.style.top = '0px';
      this._previousPanDelta = {
        x: 0,
        y: 0
      };
    },

    _redrawCanvas: function() {
      if (this.visible) {
        this._clearCanvas();
        // canvas re-drawing of all the origin/destination points
        this._drawAllCanvasPoints();
        // loop over each of the "selected" graphics and re-draw the canvas paths
        this._drawSelectedCanvasPaths();
      }
    },

    _panCanvas: function(evt) {
      // move the canvas while the map is being panned
      var canvasElement = this._getCustomCanvasElement();

      var canvasLeft = Number(canvasElement.style.left.split('px')[0]);
      var canvasTop = Number(canvasElement.style.top.split('px')[0]);

      var modifyLeft = evt.delta.x - this._previousPanDelta.x;
      var modifyTop = evt.delta.y - this._previousPanDelta.y;

      // set canvas element position
      canvasElement.style.left = canvasLeft + modifyLeft + 'px';
      canvasElement.style.top = canvasTop + modifyTop + 'px';
      // set pan delta info for the next panning events
      this._previousPanDelta = evt.delta;
    },

    _resizeCanvas: function() {
      // resize the canvas if the map was resized
      var canvasElement = this._getCustomCanvasElement();
      canvasElement.width = this._map.width;
      canvasElement.height = this._map.height;
    },

    _applyGraphicsSelection: function(selectionGraphics, selectionMode, selectionAttributeName) {
      var selectionIds = selectionGraphics.map(function(graphic) {
        return graphic.attributes._uniqueId;
      });

      if (selectionMode === 'SELECTION_NEW') {
        this.graphics.forEach(function(graphic) {
          if (selectionIds.indexOf(graphic.attributes._uniqueId) > -1) {
            graphic.attributes[selectionAttributeName] = true;
          } else {
            graphic.attributes[selectionAttributeName] = false;
          }
        });
      } else if (selectionMode === 'SELECTION_ADD') {
        this.graphics.forEach(function(graphic) {
          if (selectionIds.indexOf(graphic.attributes._uniqueId) > -1) {
            graphic.attributes[selectionAttributeName] = true;
          }
        });
      } else if (selectionMode === 'SELECTION_SUBTRACT') {
        this.graphics.forEach(function(graphic) {
          if (selectionIds.indexOf(graphic.attributes._uniqueId) > -1) {
            graphic.attributes[selectionAttributeName] = false;
          }
        });
      } else {
        return;
      }

      this._redrawCanvas();
    },

    _constructGhostGraphic: function(inputGraphicJson, isOrigin, uniqueId) {
      var configGeometryObject;
      var configCirclePropertyObject;

      if (isOrigin) {
        configGeometryObject = this.originAndDestinationFieldIds.originGeometry;
        configCirclePropertyObject = this.originCircleProperties;
      } else {
        configGeometryObject = this.originAndDestinationFieldIds.destinationGeometry;
        configCirclePropertyObject = this.destinationCircleProperties;
      }

      var clonedGraphicJson = lang.clone(inputGraphicJson);
      clonedGraphicJson.geometry.x = clonedGraphicJson.attributes[configGeometryObject.x];
      clonedGraphicJson.geometry.y = clonedGraphicJson.attributes[configGeometryObject.y];
      clonedGraphicJson.geometry.spatialReference = new SpatialReference(configGeometryObject.spatialReference.wkid);

      var ghostGraphic = new Graphic(clonedGraphicJson);
      ghostGraphic.setAttributes(lang.mixin(ghostGraphic.attributes, {
        _isOrigin: isOrigin,
        _isSelectedForPathDisplay: this.pathDisplayMode === 'all' && isOrigin ? true : false,
        _isSelectedForHighlight: false,
        _uniqueId: uniqueId
      }));

      var ghostSymbol = new SimpleMarkerSymbol();
      ghostSymbol.setColor(new Color([0, 0, 0, 0]));

      // make the ghost graphic symbol size directly tied to the size of the canvas circle
      // instead of, for example: ghostSymbol.setSize(8);
      var ghostSymbolRadius;
      if (configCirclePropertyObject.type === 'simple') {
        ghostSymbolRadius = configCirclePropertyObject.symbol.radius;
      } else if (configCirclePropertyObject.type === 'uniqueValue') {
        ghostSymbolRadius = configCirclePropertyObject.uniqueValueInfos.filter(function(info) {
          return info.value === ghostGraphic.attributes[configCirclePropertyObject.field];
        })[0].symbol.radius;
      }
      ghostSymbol.setSize(ghostSymbolRadius * 2);

      ghostSymbol.outline.setColor(new Color([0, 0, 0, 0]));
      ghostSymbol.outline.setWidth(0);

      ghostGraphic.setSymbol(ghostSymbol);

      return ghostGraphic;
    },

    _drawAllCanvasPoints: function() {
      var canvasElement = this._getCustomCanvasElement();
      var destinationUniqueIdField = this.originAndDestinationFieldIds.destinationUniqueIdField;

      // reset a temporary tracking array to make sure only 1 copy of each destination point gets drawn on the canvas
      var destinationUniqueIdValues = [];

      // TODO: does the following logic still hold for these origin-to-destination relationships?
      //  - 1-to-1
      //  - 1-to-many
      //  - many-to-1

      // loop over all graphics
      this.graphics.forEach(function(graphic) {
        if (graphic.attributes._isOrigin) {
          // re-draw all the origin points using the canvas
          if (graphic.attributes._isSelectedForHighlight) {
            this._drawNewCanvasPoint(graphic, canvasElement, this.originHighlightCircleProperties);
          } else {
            this._drawNewCanvasPoint(graphic, canvasElement, this.originCircleProperties);
          }
        } else if (destinationUniqueIdValues.indexOf(graphic.attributes[destinationUniqueIdField]) === -1) {
          // re-draw only 1 copy of each unique destination point using the canvas
          // and add the unique value value to the "destinationUniqueIdValues" array for tracking and comparison
          // NOTE: all of the "ghost" graphics will still be available for the click and mouse-over listeners
          destinationUniqueIdValues.push(graphic.attributes[destinationUniqueIdField]);

          if (graphic.attributes._isSelectedForHighlight) {
            this._drawNewCanvasPoint(graphic, canvasElement, this.destinationHighlightCircleProperties);
          } else {
            this._drawNewCanvasPoint(graphic, canvasElement, this.destinationCircleProperties);
          }
        }
      }, this);
    },

    _drawNewCanvasPoint: function(graphic, canvasElement, circleProperties) {
      // convert to screen coordinates for canvas drawing
      var screenPoint = this._map.toScreen(graphic.geometry);

      // draw a circle point on the canvas
      if (circleProperties.type === 'simple') {
        this._applyCanvasPointSymbol(canvasElement, circleProperties.symbol, screenPoint);
      } else if (circleProperties.type === 'uniqueValue') {
        var symbol = circleProperties.uniqueValueInfos.filter(function(info) {
          return info.value === graphic.attributes[circleProperties.field];
        })[0].symbol;
        this._applyCanvasPointSymbol(canvasElement, symbol, screenPoint);
      }
    },

    _applyCanvasPointSymbol: function(canvasElement, symbolObject, screenPoint) {
      var ctx = canvasElement.getContext('2d');
      ctx.globalCompositeOperation = symbolObject.globalCompositeOperation;
      ctx.fillStyle = symbolObject.fillStyle;
      ctx.lineWidth = symbolObject.lineWidth;
      ctx.strokeStyle = symbolObject.strokeStyle;
      ctx.shadowBlur = symbolObject.shadowBlur;
      ctx.beginPath();
      ctx.arc(screenPoint.x, screenPoint.y, symbolObject.radius, 0, 2 * Math.PI, false);
      ctx.fill();
      ctx.stroke();
      ctx.closePath();
    },

    _drawSelectedCanvasPaths: function() {
      var canvasElement = this._getCustomCanvasElement();

      var originAndDestinationFieldIds = this.originAndDestinationFieldIds;

      this.graphics.forEach(function(graphic) {
        if (graphic.attributes._isSelectedForPathDisplay) {
          var originXCoordinate = graphic.attributes[originAndDestinationFieldIds.originGeometry.x];
          var originYCoordinate = graphic.attributes[originAndDestinationFieldIds.originGeometry.y];
          var destinationXCoordinate = graphic.attributes[originAndDestinationFieldIds.destinationGeometry.x];
          var destinationYCoordinate = graphic.attributes[originAndDestinationFieldIds.destinationGeometry.y];
          var spatialReference = graphic.geometry.spatialReference;

          this._drawNewCanvasPath(
            originXCoordinate, originYCoordinate,
            destinationXCoordinate, destinationYCoordinate,
            spatialReference,
            canvasElement,
            this.pathProperties,
            graphic.attributes
          );
        }
      }, this);
    },

    _drawNewCanvasPath: function(originXCoordinate, originYCoordinate, destinationXCoordinate, destinationYCoordinate, spatialReference, canvasElement, pathProperties, graphicAttributes) {
      // origin point for drawing curved lines
      var originPoint = new Point(originXCoordinate, originYCoordinate, spatialReference);

      // convert to screen coordinates for canvas drawing
      var screenOriginPoint = this._map.toScreen(originPoint);

      // destination point for drawing curved lines
      var destinationPoint = new Point(destinationXCoordinate, destinationYCoordinate, spatialReference);

      // convert to screen coordinates for canvas drawing
      var screenDestinationPoint = this._map.toScreen(destinationPoint);

      // draw a curved canvas line
      if (pathProperties.type === 'simple') {
        this._applyCanvasLineSymbol(canvasElement, pathProperties.symbol, screenOriginPoint, screenDestinationPoint);
      } else if (pathProperties.type === 'uniqueValue') {
        var symbol = pathProperties.uniqueValueInfos.filter(function(info) {
          return info.value === graphicAttributes[pathProperties.field];
        })[0].symbol;
        this._applyCanvasLineSymbol(canvasElement, symbol, screenOriginPoint, screenDestinationPoint);
      }
    },

    _applyCanvasLineSymbol: function(canvasElement, symbolObject, screenOriginPoint, screenDestinationPoint) {
      var ctx = canvasElement.getContext('2d');
      ctx.lineCap = symbolObject.lineCap;
      ctx.strokeStyle = symbolObject.strokeStyle;
      ctx.shadowBlur = symbolObject.shadowBlur;
      ctx.shadowColor = symbolObject.shadowColor;
      ctx.beginPath();
      ctx.moveTo(screenOriginPoint.x, screenOriginPoint.y);
      ctx.bezierCurveTo(screenOriginPoint.x, screenDestinationPoint.y, screenDestinationPoint.x, screenDestinationPoint.y, screenDestinationPoint.x, screenDestinationPoint.y);
      ctx.stroke();
      ctx.closePath();
    },

    /*
    PUBLIC METHODS
    */

    clearAllPathSelections: function() {
      this.graphics.forEach(function(graphic) {
        graphic.attributes._isSelectedForPathDisplay = false;
      });

      this._redrawCanvas();
    },

    clearAllHighlightSelections: function() {
      this.graphics.forEach(function(graphic) {
        graphic.attributes._isSelectedForHighlight = false;
      });

      this._redrawCanvas();
    },

    selectGraphicsForPathDisplay: function(selectionGraphics, selectionMode) {
      this._applyGraphicsSelection(selectionGraphics, selectionMode, '_isSelectedForPathDisplay');
    },

    selectGraphicsForHighlight: function(selectionGraphics, selectionMode) {
      this._applyGraphicsSelection(selectionGraphics, selectionMode, '_isSelectedForHighlight');
    },

    addGraphics: function(inputGraphics) {
      inputGraphics.forEach(function(inputGraphic, index) {
        if (inputGraphic.declaredClass === 'esri.Graphic') {
          var inputGraphicJson = inputGraphic.toJson();

          // origin point
          var originGhostGraphic = this._constructGhostGraphic(inputGraphicJson, true, index + '_o');
          this.add(originGhostGraphic);

          // destination point
          var destinationGhostGraphic = this._constructGhostGraphic(inputGraphicJson, false, index + '_d');
          this.add(destinationGhostGraphic);
        }
      }, this);

      this._redrawCanvas();
    }
  });
});
