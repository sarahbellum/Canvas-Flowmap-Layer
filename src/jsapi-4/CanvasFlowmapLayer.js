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
  var CustomLayerView = BaseLayerView2D.createSubclass({
    attach: function() {
      this._renderer = this.startExportRendering({
        type: 'canvas-2d',
        createExport: this._createExport.bind(this),
        // disposeExport: function(imageSource) { }
      });
    },

    detach: function() {
      this._renderer && this._renderer.stop();
      this._renderer = null;
    },

    _createExport: function(extent, width, height, options) {
      var source = {
        width: width,
        height: height,
        // view: this.view,
        graphics: this.layer.graphics,
        originAndDestinationFieldIds: this.layer.originAndDestinationFieldIds,
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
        _renderer: this._renderer,

        render: function(ctx, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight) {
          this._drawAllCanvasPoints(ctx);
          this._drawSelectedCanvasPaths(ctx);
          // this._renderer.requestRender(source);
        },

        _drawAllCanvasPoints: function(ctx) {
          // re-draw only 1 copy of each unique ORIGIN or DESTINATION point using the canvas
          // and add the unique value value to the appropriate array for tracking and comparison

          // reset temporary tracking arrays to make sure only 1 copy of each origin or destination point gets drawn on the canvas
          var originUniqueIdValues = [];
          var destinationUniqueIdValues = [];

          var originUniqueIdField = this.originAndDestinationFieldIds.originUniqueIdField;
          var destinationUniqueIdField = this.originAndDestinationFieldIds.destinationUniqueIdField;
          
          this.graphics.forEach(function(graphic) {
            var attributes = graphic.attributes;
            var isOrigin = attributes._isOrigin;
            var symbolObject;

            if (isOrigin && originUniqueIdValues.indexOf(attributes[originUniqueIdField]) === -1) {
              originUniqueIdValues.push(attributes[originUniqueIdField]);
              symbolObject = this.symbols.originCircle;
            } else if (!isOrigin && destinationUniqueIdValues.indexOf(attributes[destinationUniqueIdField]) === -1) {
              destinationUniqueIdValues.push(attributes[destinationUniqueIdField]);
              symbolObject = this.symbols.destinationCircle;
            } else {
              // do not attempt to draw an origin or destination circle on the canvas if it is already in one of the tracking arrays
              return;
            }

            var screenCoordinates = this._convertMapPointToScreenCoordinates(graphic.geometry);

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

        _drawSelectedCanvasPaths: function(ctx) {
          this.graphics.forEach(function(graphic) {
            var attributes = graphic.attributes;

            // TODO: wire up being able to select specific O-D relationships for line drawing

            // if (!attributes._isSelectedForPathDisplay) {
            //   return;
            // }

            // for now, just draw "one half" of all O-D graphics
            if (!attributes._isOrigin) {
              return;
            }

            // origin and destination points for drawing curved lines
            var originPoint = new Point({
              x: attributes[this.originAndDestinationFieldIds.originGeometry.x],
              y: attributes[this.originAndDestinationFieldIds.originGeometry.y],
              spatialReference: graphic.geometry.spatialReference
            });

            var destinationPoint = new Point({
              x: attributes[this.originAndDestinationFieldIds.destinationGeometry.x],
              y: attributes[this.originAndDestinationFieldIds.destinationGeometry.y],
              spatialReference: graphic.geometry.spatialReference
            });

            var screenOriginCoordinates = this._convertMapPointToScreenCoordinates(originPoint);
            var screenDestinationCoordinates = this._convertMapPointToScreenCoordinates(destinationPoint);

            this._applyCanvasLineSymbol(ctx, this.symbols.flowline, screenOriginCoordinates, screenDestinationCoordinates);
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

        _convertMapPointToScreenCoordinates: function(mapPoint) {
          var mapPoint = mapPoint.spatialReference.isGeographic
            ? webMercatorUtils.geographicToWebMercator(mapPoint)
            : mapPoint;

          var screenPoint = [0, 0];

          options.toScreen(screenPoint, mapPoint.x, mapPoint.y);

          return screenPoint;
        }
      };

      return source;
    }
  });

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
    
    createLayerView: function(view) {
      if (view.type === '2d') {
        // convert single set of graphics into array of
        // individual origin and destination graphics
        this._convertOriginAndDestinationGraphics();

        return new CustomLayerView({
          view: view,
          layer: this
        });
      }
    },

    _convertOriginAndDestinationGraphics: function() {
      this.graphics.forEach(function(originGraphic, idx, graphicsArray) {
        originGraphic.attributes._isOrigin = true;

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
