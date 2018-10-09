# Canvas-Flowmap-Layer for Esri JSAPI v4

## Table of Contents

- [Demos](#demos)
- [Developer API](#developer-api)
  - [Constructor](#constructor)
  - [Properties](#properties)
  - [Methods](#methods)
  - [Events](#events)

## Demos

- [Simple demo](https://sarahbellum.github.io/Canvas-Flowmap-Layer/demos-jsapi-4/main)
- [Automatic rotation demo](https://sarahbellum.github.io/Canvas-Flowmap-Layer/demos-jsapi-4/rotate)
- [Automatic world wrapping](https://sarahbellum.github.io/Canvas-Flowmap-Layer/demos-jsapi-4/world-wrap)
- [Albers Alaska projection demo](https://sarahbellum.github.io/Canvas-Flowmap-Layer/demos-jsapi-4/albers-alaska-projection)
- [WGS84 projection demo](https://sarahbellum.github.io/Canvas-Flowmap-Layer/demos-jsapi-4/wgs84-projection)

## Developer API

This custom layer can only be used with a 2D `MapView`. 3D `SceneView`s are not supported.

It extends the Esri JSAPI v4 [`esri/views/2d/layers/BaseLayerView2D`](https://developers.arcgis.com/javascript/latest/api-reference/esri-views-2d-layers-BaseLayerView2D.html). All properties, methods, and events provided by the the `CanvasFlowmapLayer` are described below.

### Constructor

```javascript
// an example of constructing a new layer
var canvasFlowmapLayer = new CanvasFlowmapLayer({
  // array of Graphics
  graphics: yourGraphicsArray,

  // inform the layer of your unique origin/destination attributes and geometry fields
  originAndDestinationFieldIds: {
    // all kinds of important stuff here...see docs below
  }
});

// add the layer to your JSAPI map in your 2D MapView
map.addLayer(canvasFlowmapLayer);
```

### Properties

| Property | Description |
| --- | --- |
| `graphics` | **Required**. `Array` of Esri [`Graphic`s](https://developers.arcgis.com/javascript/latest/api-reference/esri-Graphic.html). This will be converted to an Esri [`Collection`](https://developers.arcgis.com/javascript/latest/api-reference/esri-core-Collection.html) of [`Graphic`s](https://developers.arcgis.com/javascript/latest/api-reference/esri-Graphic.html) when the layer is constructed.
| `originAndDestinationFieldIds` | **Required**. `Object`. This object informs the layer of your unique origin and destination attributes (fields). Both origins and destinations need to have their own unique ID attribute and geometry definition. [See example below](#originanddestinationfieldids-example) which includes minimum required object properties. |

**`originAndDestinationFieldIds` example:**

```javascript
// you must fill in each of these values for these required properties,
// using the schema of your own data
{
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
}
```

### Methods

| Method | Arguments | Description |
| --- | --- | --- |
| `selectGraphicsForPathDisplayById( uniqueOriginOrDestinationIdField, idValue, originBoolean, selectionMode )` |  | Use this method if the unique origin or destination value is already known and you wish to "mark" or "flag" the origin-destination relationship to display its Bezier paths in the MapView. |

### Events

| Event | Description |
| --- | --- |
