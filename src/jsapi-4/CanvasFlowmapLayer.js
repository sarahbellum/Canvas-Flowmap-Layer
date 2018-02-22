define([
  'esri/layers/Layer',
  'esri/views/2d/layers/BaseLayerView2D'
], function(
  Layer,
  BaseLayerView2D
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
        view: this.view,
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
          pathSymbol: {
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

            var mapPoint = graphic.geometry;

            var screenPoint = this.view.toScreen(mapPoint);

            // var pt = [0,0];
            // options.toScreen(pt, mapPoint.x, mapPoint.y);

            ctx.beginPath();
            ctx.globalCompositeOperation = symbolObject.globalCompositeOperation;
            ctx.fillStyle = symbolObject.fillStyle;
            ctx.lineWidth = symbolObject.lineWidth;
            ctx.strokeStyle = symbolObject.strokeStyle;
            ctx.shadowBlur = symbolObject.shadowBlur;
            ctx.arc(screenPoint.x, screenPoint.y, symbolObject.radius, 0, 2 * Math.PI, false);
            // ctx.arc(pt[0], pt[1], symbolObject.radius, 0, 2 * Math.PI, false);
            ctx.fill();
            ctx.stroke();
            ctx.closePath();
          }, this);
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
