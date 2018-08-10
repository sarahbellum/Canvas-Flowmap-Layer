define([
  'esri/layers/Layer',
  'esri/views/2d/layers/BaseLayerView2D',
  'esri/geometry/Point',
  'esri/geometry/support/webMercatorUtils',
  'esri/core/Collection'
], function(
  Layer,
  BaseLayerView2D,
  Point,
  webMercatorUtils,
  Collection
) {
  /*
      PART A: custom layer view, which is used by the custom layer in PART B
      https://developers.arcgis.com/javascript/latest/api-reference/esri-views-2d-layers-BaseLayerView2D.html
    */
  var CustomLayerView = BaseLayerView2D.createSubclass({
    render: function(renderParameters) {
      this._drawAllCanvasPoints(renderParameters);
      this._drawAllCanvasPaths(renderParameters);
    },

    _drawAllCanvasPoints: function(renderParameters) {
      // re-draw only 1 copy of each unique ORIGIN or DESTINATION point using the canvas
      // and add the unique value value to the appropriate array for tracking and comparison

      // reset temporary tracking arrays to make sure only 1 copy of each origin or destination point gets drawn on the canvas
      var originUniqueIdValues = [];
      var destinationUniqueIdValues = [];

      var originUniqueIdField = this.layer.originAndDestinationFieldIds.originUniqueIdField;
      var destinationUniqueIdField = this.layer.originAndDestinationFieldIds.destinationUniqueIdField;

      this.layer.graphics.forEach(function(graphic) {
        var attributes = graphic.attributes;
        var isOrigin = attributes._isOrigin;
        var symbolObject;

        if (isOrigin && originUniqueIdValues.indexOf(attributes[originUniqueIdField]) === -1) {
          originUniqueIdValues.push(attributes[originUniqueIdField]);
          symbolObject = this.layer.symbols.originCircle;
        } else if (!isOrigin && destinationUniqueIdValues.indexOf(attributes[destinationUniqueIdField]) === -1) {
          destinationUniqueIdValues.push(attributes[destinationUniqueIdField]);
          symbolObject = this.layer.symbols.destinationCircle;
        } else {
          // do not attempt to draw an origin or destination circle on the canvas if it is already in one of the tracking arrays
          return;
        }

        var screenCoordinates = this._convertMapPointToScreenCoordinates(graphic.geometry, renderParameters.state);

        this._applyCanvasPointSymbol(renderParameters.context, symbolObject, screenCoordinates);
      }, this);
    },

    _applyCanvasPointSymbol: function(ctx, symbolObject, screenCoordinates) {
      ctx.beginPath();
      ctx.globalCompositeOperation = symbolObject.globalCompositeOperation;
      ctx.fillStyle = symbolObject.fillStyle;
      ctx.lineWidth = symbolObject.lineWidth;
      ctx.strokeStyle = symbolObject.strokeStyle;
      ctx.shadowBlur = symbolObject.shadowBlur;
      ctx.arc(screenCoordinates[0], screenCoordinates[1], symbolObject.radius, 0, 2 * Math.PI, false);
      ctx.fill();
      ctx.stroke();
      ctx.closePath();
    },

    _drawAllCanvasPaths: function(renderParameters) {
      this.layer.graphics.forEach(function(graphic) {
        var attributes = graphic.attributes;

        if (!attributes._isSelectedForPathDisplay) {
          return;
        }

        // origin and destination points for drawing curved lines
        var originPoint = new Point({
          x: attributes[this.layer.originAndDestinationFieldIds.originGeometry.x],
          y: attributes[this.layer.originAndDestinationFieldIds.originGeometry.y],
          spatialReference: graphic.geometry.spatialReference
        });

        var destinationPoint = new Point({
          x: attributes[this.layer.originAndDestinationFieldIds.destinationGeometry.x],
          y: attributes[this.layer.originAndDestinationFieldIds.destinationGeometry.y],
          spatialReference: graphic.geometry.spatialReference
        });

        var screenOriginCoordinates = this._convertMapPointToScreenCoordinates(originPoint, renderParameters.state);
        var screenDestinationCoordinates = this._convertMapPointToScreenCoordinates(destinationPoint, renderParameters.state);

        this._applyCanvasLineSymbol(renderParameters.context, this.layer.symbols.flowline, screenOriginCoordinates, screenDestinationCoordinates);
      }, this);
    },

    _applyCanvasLineSymbol: function(ctx, symbolObject, screenOriginCoordinates, screenDestinationCoordinates) {
      ctx.beginPath();
      ctx.lineCap = symbolObject.lineCap;
      ctx.lineWidth = symbolObject.lineWidth;
      ctx.strokeStyle = symbolObject.strokeStyle;
      ctx.shadowBlur = symbolObject.shadowBlur;
      ctx.shadowColor = symbolObject.shadowColor;
      ctx.moveTo(screenOriginCoordinates[0], screenOriginCoordinates[1]); // start point
      ctx.bezierCurveTo(
        screenOriginCoordinates[0], screenDestinationCoordinates[1], // control point
        screenDestinationCoordinates[0], screenDestinationCoordinates[1], // control point
        screenDestinationCoordinates[0], screenDestinationCoordinates[1] // end point
      );
      ctx.stroke();
      ctx.closePath();
    },

    /*
    GEOMETRY METHODS
    */

    _convertMapPointToScreenCoordinates: function(mapPoint, rendererState) {
      var mapPoint = mapPoint.spatialReference.isGeographic
        ? webMercatorUtils.geographicToWebMercator(mapPoint)
        : mapPoint;

      var screenPoint = [0, 0];

      if (rendererState && rendererState.toScreen) {
        rendererState.toScreen(screenPoint, mapPoint.x, mapPoint.y);
      }

      return screenPoint;
    },

    // TODO: wrap around +/- 180?

    /*
    SELECTION/INTERACTION METHODS
    */

    selectGraphicsForPathDisplayById: function(uniqueOriginOrDestinationIdField, idValue, originBoolean, selectionMode) {
      if (
        uniqueOriginOrDestinationIdField !== this.layer.originAndDestinationFieldIds.originUniqueIdField &&
          uniqueOriginOrDestinationIdField !== this.layer.originAndDestinationFieldIds.destinationUniqueIdField
      ) {
        console.error(
          'Invalid unique id field supplied for origin or destination. It must be one of these: ' +
            this.layer.originAndDestinationFieldIds.originUniqueIdField +
            ', ' +
            this.layer.originAndDestinationFieldIds.destinationUniqueIdField
        );

        return;
      }

      var existingOriginOrDestinationGraphic = this.layer.graphics.find(function(graphic) {
        return graphic.attributes._isOrigin === originBoolean &&
            graphic.attributes[uniqueOriginOrDestinationIdField] === idValue;
      });

      var odInfo = this._getSharedOriginOrDestinationGraphics(existingOriginOrDestinationGraphic);

      if (odInfo.isOriginGraphic) {
        this.selectGraphicsForPathDisplay(odInfo.sharedOriginGraphics, selectionMode);
      } else {
        this.selectGraphicsForPathDisplay(odInfo.sharedDestinationGraphics, selectionMode);
      }
    },

    selectGraphicsForPathDisplay: function(selectionGraphics, selectionMode) {
      var selectionIds = selectionGraphics.map(function(graphic) {
        return graphic.attributes._uniqueId;
      });

      if (selectionMode === 'SELECTION_NEW') {
        this.layer.graphics.forEach(function(graphic) {
          if (selectionIds.indexOf(graphic.attributes._uniqueId) > -1) {
            graphic.attributes._isSelectedForPathDisplay = true;
          } else {
            graphic.attributes._isSelectedForPathDisplay = false;
          }
        });
      } else if (selectionMode === 'SELECTION_ADD') {
        this.layer.graphics.forEach(function(graphic) {
          if (selectionIds.indexOf(graphic.attributes._uniqueId) > -1) {
            graphic.attributes._isSelectedForPathDisplay = true;
          }
        });
      } else if (selectionMode === 'SELECTION_SUBTRACT') {
        this.layer.graphics.forEach(function(graphic) {
          if (selectionIds.indexOf(graphic.attributes._uniqueId) > -1) {
            graphic.attributes._isSelectedForPathDisplay = false;
          }
        });
      } else {
        return;
      }

      // https://developers.arcgis.com/javascript/latest/api-reference/esri-views-2d-layers-BaseLayerView2D.html#requestRender
      this.requestRender();
    },

    _getSharedOriginOrDestinationGraphics: function(testGraphic) {
      var isOriginGraphic = testGraphic.attributes._isOrigin;
      var sharedOriginGraphics = [];
      var sharedDestinationGraphics = [];

      if (isOriginGraphic) {
        // for an ORIGIN point that was interacted with,
        // make an array of all other ORIGIN graphics with the same ORIGIN ID field
        var originUniqueIdField = this.layer.originAndDestinationFieldIds.originUniqueIdField;
        var testGraphicOriginId = testGraphic.attributes[originUniqueIdField];
        sharedOriginGraphics = this.layer.graphics.filter(function(graphic) {
          return graphic.attributes._isOrigin &&
              graphic.attributes[originUniqueIdField] === testGraphicOriginId;
        });
      } else {
        // for a DESTINATION point that was interacted with,
        // make an array of all other ORIGIN graphics with the same DESTINATION ID field
        var destinationUniqueIdField = this.layer.originAndDestinationFieldIds.destinationUniqueIdField;
        var testGraphicDestinationId = testGraphic.attributes[destinationUniqueIdField];
        sharedDestinationGraphics = this.layer.graphics.filter(function(graphic) {
          return graphic.attributes._isOrigin &&
              graphic.attributes[destinationUniqueIdField] === testGraphicDestinationId;
        });
      }

      return {
        isOriginGraphic: isOriginGraphic, // Boolean
        sharedOriginGraphics: sharedOriginGraphics, // Array of graphics
        sharedDestinationGraphics: sharedDestinationGraphics // Array of graphics
      };
    },
  });

    /*
      PART B: custom layer, which makes use of the custom layer view in PART A
    */
  var CustomLayer = Layer.createSubclass({
    declaredClass: 'esri.layers.CanvasFlowmapLayer',

    graphics: [],

    originAndDestinationFieldIds: {
      originUniqueIdField: 'start_id',
      originGeometry: {
        x: 'start_longitude',
        y: 'start_latitude',
        spatialReference: {
          wkid: 4326
        }
      },
      destinationUniqueIdField: 'end_id',
      destinationGeometry: {
        x: 'end_lon',
        y: 'end_lat',
        spatialReference: {
          wkid: 4326
        }
      }
    },

    symbols: {
      originCircle: {
        globalCompositeOperation: 'destination-over',
        radius: 5,
        fillStyle: 'rgba(195, 255, 62, 0.60)',
        lineWidth: 1,
        strokeStyle: 'rgb(195, 255, 62)',
        shadowBlur: 0
      },
      destinationCircle: {
        globalCompositeOperation: 'destination-over',
        radius: 2.5,
        fillStyle: 'rgba(17, 142, 170, 0.7)',
        lineWidth: 0.25,
        strokeStyle: 'rgb(17, 142, 170)',
        shadowBlur: 0
      },
      flowline: {
        strokeStyle: 'rgba(255, 0, 51, 0.8)',
        lineWidth: 0.75,
        lineCap: 'round',
        shadowColor: 'rgb(255, 0, 51)',
        shadowBlur: 1.5
      }
    },

    createLayerView: function(view) {
      if (view.type !== '2d') {
        return;
      }

      // convert the original array of graphics into a combined array Collection of
      // individual origin and destination graphics (i.e. 2x the original array)
      this.graphics = this._convertToOriginAndDestinationGraphics(this.graphics, this.originAndDestinationFieldIds);

      // here the pieces are all glued together
      // with an instance of the custom layer view
      return new CustomLayerView({
        view: view,
        layer: this
      });
    },

    _convertToOriginAndDestinationGraphics: function(originalGraphicsArray, originAndDestinationFieldIds) {
      // var originAndDestinationGraphics = [];

      var originAndDestinationGraphics = new Collection();

      originalGraphicsArray.forEach(function(originGraphic, index) {
        // origin graphic
        originGraphic.attributes._isOrigin = true;
        originGraphic.attributes._isSelectedForPathDisplay = false;
        originGraphic.attributes._uniqueId = index + '_o';

        // destination graphic
        var destinationGraphic = originGraphic.clone();
        destinationGraphic.attributes._isOrigin = false;
        destinationGraphic.attributes._isSelectedForPathDisplay = false;
        destinationGraphic.attributes._uniqueId = index + '_d';
        destinationGraphic.geometry = {
          type: 'point',
          x: destinationGraphic.attributes[originAndDestinationFieldIds.destinationGeometry.x],
          y: destinationGraphic.attributes[originAndDestinationFieldIds.destinationGeometry.y],
          spatialReference: originAndDestinationFieldIds.destinationGeometry.spatialReference
        };

        originAndDestinationGraphics.push(originGraphic);
        originAndDestinationGraphics.push(destinationGraphic);
      });

      return originAndDestinationGraphics;
    }
  });

  return CustomLayer;
});
