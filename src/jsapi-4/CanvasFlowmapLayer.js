define([
  'esri/layers/Layer',
  'esri/views/2d/layers/BaseLayerView2D'
], function(
  Layer,
  BaseLayerView2D
) {
  var CustomLayerView = BaseLayerView2D.createSubclass({
    attach: function() {
      var renderer = this.startExportRendering({
        type: 'canvas-2d',
        layer: this.layer,
        view: this.view,

        createExport: function(extent, width, height, options) {
          var source = {
            width: width,
            height: height,

            graphics: this.layer.graphics,
            view: this.view,
            
            render: function(ctx, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight) {
              // ctx.strokeRect(dx, dy, dWidth, dHeight);

              // var pt = [0, 0];
              // ctx.fillStyle = 'red';

              // options.toScreen(pt, extent.xmin, extent.ymax);
              // ctx.fillRect(pt[0], pt[1], 20, 20);

              // options.toScreen(pt, extent.xmax, extent.ymax);
              // ctx.fillRect(pt[0] - 20, pt[1], 20, 20);

              // options.toScreen(pt, extent.xmax, extent.ymin);
              // ctx.fillRect(pt[0] - 20, pt[1] - 20, 20, 20);

              // options.toScreen(pt, extent.xmin, extent.ymin);
              // ctx.fillRect(pt[0], pt[1] - 20, 20, 20);

              // ctx.fillText(JSON.stringify(extent.toJSON()), 20, 20);

              var symbolObject = {
                globalCompositeOperation: 'destination-over',
                radius: 5,
                fillStyle: 'rgba(195, 255, 62, 0.60)',
                lineWidth: 1,
                strokeStyle: 'rgb(195, 255, 62)',
                shadowBlur: 0
              };

              this._drawAllCanvasPoints(ctx, this.view, symbolObject);              

              renderer.requestRender(source);
            },

            _drawAllCanvasPoints: function(ctx, view, symbolObject) {
              this.graphics.forEach(function(graphic, idx) {
                // if (idx > 100) {
                //   return;
                // }

                var mapPoint = graphic.geometry;

                var screenPoint = view.toScreen(mapPoint);

                // var screenCoordinates = options.toScreen(mapPoint.toArray(), screenPoint.x, screenPoint.y)

                ctx.beginPath();
                ctx.globalCompositeOperation = symbolObject.globalCompositeOperation;
                ctx.fillStyle = symbolObject.fillStyle;
                ctx.lineWidth = symbolObject.lineWidth;
                ctx.strokeStyle = symbolObject.strokeStyle;
                ctx.shadowBlur = symbolObject.shadowBlur;
                ctx.arc(screenPoint.x, screenPoint.y, symbolObject.radius, 0, 2 * Math.PI, false);
                // ctx.arc(screenCoordinates[0], screenCoordinates[1], symbolObject.radius, 0, 2 * Math.PI, false);
                ctx.fill();
                ctx.stroke();
                ctx.closePath();
              });
            }
          };

          return source;
        },

        // disposeExport: function(imageSource) { }
      });
    },

    detach: function() {
      this._renderer && this._renderer.stop();
      this._renderer = null;
    }
  });

  var CustomLayer = Layer.createSubclass({
    createLayerView: function(view) {
      if (view.type === '2d') {
        return new CustomLayerView({
          view: view,
          layer: this
        });
      }
    }
  });

  return CustomLayer;
});
