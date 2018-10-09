define([
  'esri/layers/Layer',
  'esri/views/2d/layers/BaseLayerView2D',
  'esri/geometry/Point',
  'esri/geometry/projection',
  'esri/core/Collection',
  'esri/core/promiseUtils'
], function(
  Layer,
  BaseLayerView2D,
  Point,
  projection,
  Collection,
  promiseUtils
) {
  /*
    PART A:
    custom layer view, which is used by the custom layer in PART B
    https://developers.arcgis.com/javascript/latest/api-reference/esri-views-2d-layers-BaseLayerView2D.html
  */
  var CustomLayerView = BaseLayerView2D.createSubclass({
    /*
      CANVAS RENDERING METHODS
    */
    render: function(renderParameters) {
      this._drawAllCanvasPaths(renderParameters);
      this._drawAllCanvasPoints(renderParameters);
    },

    _drawAllCanvasPaths: function(renderParameters) {
      this.layer.graphics.forEach(function(graphic) {
        if (!graphic.attributes._isSelectedForPathDisplay) {
          return;
        }

        // origin and destination points converted to screen coordinates for drawing curved Bezier paths
        var originPoint = graphic.geometry;

        var destinationPoint = this.layer.graphics.find(function(graphicToFind) {
          return graphicToFind.attributes._uniqueId === graphic.attributes._uniqueId.split('_')[0] + '_d';
        }).geometry;

        var screenOriginCoordinates = this._convertMapPointToScreenCoordinates(originPoint, renderParameters.state);

        var screenDestinationCoordinates = this._convertMapPointToScreenCoordinates(destinationPoint, renderParameters.state);

        this._applyCanvasPathSymbol(renderParameters.context, this.layer.symbols.flowline, screenOriginCoordinates, screenDestinationCoordinates);
      }, this);
    },

    _applyCanvasPathSymbol: function(ctx, symbolObject, screenOriginCoordinates, screenDestinationCoordinates) {
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
        var isOrigin = attributes.isOrigin;
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

    /*
      GEOMETRY TO CANVAS HELPER METHODS
    */
    _convertMapPointToScreenCoordinates: function(mapPoint, rendererState) {
      // attempt to wrap around the world
      // but no matter what, end up with [x, y] map coordinates array
      var mapCoordinates = this._pointGeometryToWrappedMapCoordinates(mapPoint, rendererState);

      // convert [x, y] map coordinates array to screen coordinates array
      var screenCoordinates = rendererState.toScreen([0, 0], mapCoordinates[0], mapCoordinates[1]);

      return screenCoordinates;
    },

    _pointGeometryToWrappedMapCoordinates: function(geometryPoint, rendererState) {
      // attempt to wrap around the world if possible and necessary
      // otherwise, simply return the [x, y] map coordinates array
      var wrappedMapCoordinates = [geometryPoint.x, geometryPoint.y]

      if (this.view.spatialReference.isWrappable) {
        // rendererState.center[0] provides info on how far east or west we have rotated around the world,
        // including **how many times** we have rotated around the world
        // in other words: this property is NOT limited to only +/-180 degrees of longitude
        var wrapAroundDiff = rendererState.center[0] - wrappedMapCoordinates[0];

        if (
          wrapAroundDiff < this.layer._worldMinX ||
          wrapAroundDiff > this.layer._worldMaxX
        ) {
          var worldWidth = this.layer._worldWidth;
          wrappedMapCoordinates[0] = wrappedMapCoordinates[0] + (Math.round(wrapAroundDiff / worldWidth) * worldWidth);
        }
      }

      return wrappedMapCoordinates;
    },

    /*
      USER SELECTION AND INTERACTION METHODS
    */
    hitTest: function(x, y) {
      // var hitTestMapPoint = this.view.toMap(x, y);

      var graphicHits = this.layer.graphics.filter(function(graphic) {
        // TODO: Unwrap geometries? These screen coordinates are never going to
        // contain the hitTest screen coordinates if the world has already been wrapped.
        var screenCoordinates = this.view.toScreen(graphic.geometry);

        var size;
        if (graphic.attributes.isOrigin) {
          size = this.layer.symbols.originCircle.radius + this.layer.symbols.originCircle.lineWidth;
        } else {
          size = this.layer.symbols.destinationCircle.radius + this.layer.symbols.destinationCircle.lineWidth;
        }

        // does a "screen extent" of each O/D point contain the hitTest screen coordinates?
        if (
          (
            (screenCoordinates.x - size) <= x &&
            (screenCoordinates.x + size) >= x
          ) && (
            (screenCoordinates.y - size) <= y &&
            (screenCoordinates.y + size) >= y
          )
        ) {
          return true;
        } else {
          return false;
        }

        /*
        var aPoint = this.view.toMap({
          x: screenCoordinates.x - size,
          y: screenCoordinates.y - size
        });

        var bPoint = this.view.toMap({
          x: screenCoordinates.x + size,
          y: screenCoordinates.y + size
        });

        var extentGeometry = new Extent({
          xmin: aPoint.x,
          ymin: bPoint.y,
          xmax: bPoint.x,
          ymax: aPoint.y,
          spatialReference: this.view.spatialReference
        }).normalize();

        if (extentGeometry.contains(hitTestMapPoint)) {
          return true;
        } else {
          return false;
        }
        */
      }.bind(this));

      graphicHits.forEach(function(graphic) {
        graphic.layer = this.layer;
      }.bind(this))

      // TODO: Support giving back multiple graphics for a hitTest?
      // console.log(graphicHits.length)
      // for now, just return the first graphic that was found
      return promiseUtils.resolve(graphicHits.items[0]);
    },

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
        return graphic.attributes.isOrigin === originBoolean &&
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
      var isOriginGraphic = testGraphic.attributes.isOrigin;
      var sharedOriginGraphics = [];
      var sharedDestinationGraphics = [];

      if (isOriginGraphic) {
        // for an ORIGIN point that was interacted with,
        // make an array of all other ORIGIN graphics with the same ORIGIN ID field
        var originUniqueIdField = this.layer.originAndDestinationFieldIds.originUniqueIdField;
        var testGraphicOriginId = testGraphic.attributes[originUniqueIdField];
        sharedOriginGraphics = this.layer.graphics.filter(function(graphic) {
          return graphic.attributes.isOrigin &&
            graphic.attributes[originUniqueIdField] === testGraphicOriginId;
        });
      } else {
        // for a DESTINATION point that was interacted with,
        // make an array of all other ORIGIN graphics with the same DESTINATION ID field
        var destinationUniqueIdField = this.layer.originAndDestinationFieldIds.destinationUniqueIdField;
        var testGraphicDestinationId = testGraphic.attributes[destinationUniqueIdField];
        sharedDestinationGraphics = this.layer.graphics.filter(function(graphic) {
          return graphic.attributes.isOrigin &&
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
    PART B:
    custom layer, which makes use of the custom layer view in PART A
  */
  var CustomLayer = Layer.createSubclass({
    declaredClass: 'esri.layers.CanvasFlowmapLayer',

    graphics: [],
    _worldMinX: null,
    _worldMaxX: null,
    _worldWidth: null,

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

      return projection
        .load()
        .then(function() {
          if (view.spatialReference.isWrappable) {
            // -180 if WGS84
            this._worldMinX = projection.project(new Point({
              x: -180,
              y: 0,
              spatialReference: {
                wkid: 4326
              }
            }), view.spatialReference).x;

            // +180 if WGS84
            // this._worldMaxX = projection.project(new Point({
            //   x: 180,
            //   y: 0,
            //   spatialReference: {
            //     wkid: 4326
            //   }
            // }), view.spatialReference).x;
            this._worldMaxX = -this._worldMinX;

            // 360 if WGS84
            this._worldWidth = this._worldMaxX - this._worldMinX;
          }

          // convert the constructor's array of graphics into a combined array Collection of
          // individual origin graphics AND destination graphics (i.e. 2x the original array length)
          // these will also be projected into the view's spatial reference
          this.graphics = this._convertToOriginAndDestinationGraphics(this.graphics, this.originAndDestinationFieldIds, view);

          // here the PART A and PART B pieces are glued together
          // with an instance of the custom layer view
          return new CustomLayerView({
            view: view,
            layer: this
          });
        }.bind(this));

    },

    _convertToOriginAndDestinationGraphics: function(originalGraphicsArray, originAndDestinationFieldIds, view) {
      var originAndDestinationGraphics = new Collection();

      originalGraphicsArray.forEach(function(originGraphic, index) {
        // origin graphic
        originGraphic.attributes.isOrigin = true;
        originGraphic.attributes._isSelectedForPathDisplay = false;
        originGraphic.attributes._uniqueId = index + '_o';

        originGraphic.geometry = projection.project(originGraphic.geometry, view.spatialReference);

        // destination graphic
        var destinationGraphic = originGraphic.clone();
        destinationGraphic.attributes.isOrigin = false;
        destinationGraphic.attributes._isSelectedForPathDisplay = false;
        destinationGraphic.attributes._uniqueId = index + '_d';

        destinationGraphic.geometry = projection.project(new Point({
          x: destinationGraphic.attributes[originAndDestinationFieldIds.destinationGeometry.x],
          y: destinationGraphic.attributes[originAndDestinationFieldIds.destinationGeometry.y],
          spatialReference: originAndDestinationFieldIds.destinationGeometry.spatialReference
        }), view.spatialReference);

        originAndDestinationGraphics.push(originGraphic);
        originAndDestinationGraphics.push(destinationGraphic);
      });

      return originAndDestinationGraphics;
    }
  });

  return CustomLayer;
});
