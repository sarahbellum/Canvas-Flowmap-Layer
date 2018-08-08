define([
  'esri/layers/Layer',
  'esri/views/2d/layers/BaseLayerView2D',
  'esri/geometry/Point',
  'esri/geometry/support/webMercatorUtils'
], function(
  Layer,
  BaseLayerView2D,
  Point,
  webMercatorUtils
) {
  /*
    PART A: custom layer view
  */
  var CustomLayerView = BaseLayerView2D.createSubclass({
    render: function(renderParameters) {
      this._drawAllCanvasPoints(renderParameters.context, renderParameters.state);
      this._drawAllCanvasPaths(renderParameters.context, renderParameters.state);
    },

    _drawAllCanvasPoints: function(ctx, state) {
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

        var screenCoordinates = this._convertMapPointToScreenCoordinates(graphic.geometry, state);

        this._applyCanvasPointSymbol(ctx, symbolObject, screenCoordinates);
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

    _drawAllCanvasPaths: function(ctx, state) {
      this.layer.graphics.forEach(function(graphic) {
        var attributes = graphic.attributes;

        // TODO: wire up being able to select specific O-D relationships for line drawing

        // if (!attributes._isSelectedForPathDisplay) {
        //   return;
        // }

        // TODO: for now, just draw "one half" of all O-D graphics
        // and hard-code the Alexandria, Egypt O-D example
        if (!attributes._isOrigin || [1].indexOf(attributes.s_city_id) === -1) {
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

        var screenOriginCoordinates = this._convertMapPointToScreenCoordinates(originPoint, state);
        var screenDestinationCoordinates = this._convertMapPointToScreenCoordinates(destinationPoint, state);

        this._applyCanvasLineSymbol(ctx, this.layer.symbols.flowline, screenOriginCoordinates, screenDestinationCoordinates);
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

    _convertMapPointToScreenCoordinates: function(mapPoint, rendererState) {
      var mapPoint = mapPoint.spatialReference.isGeographic
        ? webMercatorUtils.geographicToWebMercator(mapPoint)
        : mapPoint;

      var screenPoint = [0, 0];

      if (rendererState && rendererState.toScreen) {
        rendererState.toScreen(screenPoint, mapPoint.x, mapPoint.y);
      }

      return screenPoint;
    }
  });

  /*
    PART B: custom layer, which makes use of custom layer view from PART A
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
      if (view.type === '2d') {
        // convert single set of graphics into array of
        // individual origin and destination graphics
        this._convertOriginAndDestinationGraphics();

        // here the pieces are all glued together
        // with an instance of the custom layer view
        return new CustomLayerView({
          view: view,
          layer: this
        });
      }
    },

    _convertOriginAndDestinationGraphics: function() {
      this.graphics.forEach(function(originGraphic, idx, graphicsArray) {
        // origin graphic
        originGraphic.attributes._isOrigin = true;

        // destination graphic
        var destinationGraphic = originGraphic.clone();
        destinationGraphic.attributes._isOrigin = false;
        destinationGraphic.geometry = {
          type: 'point',
          x: destinationGraphic.attributes[this.originAndDestinationFieldIds.destinationGeometry.x],
          y: destinationGraphic.attributes[this.originAndDestinationFieldIds.destinationGeometry.y],
          spatialReference: this.originAndDestinationFieldIds.destinationGeometry.spatialReference
        };

        graphicsArray.push(destinationGraphic);
      }, this);
    }
  });

  return CustomLayer;
});
