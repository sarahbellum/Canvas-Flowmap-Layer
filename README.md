# Canvas-Flowline-Layer

Cool summary...

### API

Extends JSAPI 3.x [esri/layers/GraphicsLayer](https://developers.arcgis.com/javascript/3/jsapi/graphicslayer-amd.html). All properties, methods, and events provided by the `GraphicsLayer` should be available in this `CanvasFlowlineLayer`.

### Constructor Summary

```javascript
// an example of constructing a new layer
var canvasFlowlineLayer = new CanvasFlowlineLayer({
  // JSAPI GraphicsLayer constructor properties can be used
  id: 'myCanvasFlowlineLayer',
  visible: true,

  // CanvasFlowlineLayer custom constructor properties -- see property table below

  // - required property
  //that informs the layer of your unique origin/destination attributes and geometry
  originAndDestinationFieldIds: {/* all kinds of important stuff here...see docs below */},

  // - some optional properties
  pathDisplayMode: 'selection',
  animationStarted: true,
  animationStyle: 'ease-out'
});

// construct an array of esri/Graphic yourself and add them to the layer
canvasFlowlineLayer.addGraphics([pointGraphic1, pointGraphic2, ..., pointGraphic100]);

// add the layer to your JSAPI map
map.addLayer(canvasFlowlineLayer);
```

### Property Summary

| Property | Description |
| --- | --- |
| `originAndDestinationFieldIds` | **Required**. `Object`. This object informs the layer of your unique origin and destination attributes (fields). Both origins and destinations need to have their own unique ID attribute and geometry definition. [See example below](#originAndDestinationFieldIds-example) which includes minimum required object properties.  |
| `originCircleProperties` | _Optional_. `Object`. |
| `originHighlightCircleProperties` | _Optional_. `Object`. |
| `destinationCircleProperties` | _Optional_. `Object`. |
| `destinationHighlightCircleProperties` | _Optional_. `Object`. |
| `pathProperties` | _Optional_. `Object`. |
| `animatePathProperties` | _Optional_. `Object`. |
| `pathDisplayMode` | _Optional_. `String`. Valid values: `'selection'` or `'all'`. Defaults to `'all'`. |
| `wrapAroundCanvas` | _Optional_. `Boolean`. Defaults to `true`. |
| `animationStarted` | _Optional_. `Boolean`. Defaults to `false`. |
| `animationStyle` | _Optional_. `String`. Valid values: `'linear'`, `'ease-out'`, or `'ease-in'` Defaults to `'ease-out'`. |

##### `originAndDestinationFieldIds` example
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

### Method Summary

| Method | Description |
| --- | --- |
| `addGraphics(inputGraphics)` | This does... This returns... |
| `selectGraphicsForPathDisplay(selectionGraphics, selectionMode)` | This does... This returns... |
| `selectGraphicsForPathDisplayById(uniqueOriginOrDestinationIdField, idValue, originBoolean, selectionMode)` | This does... This returns... |
| `clearAllPathSelections()` | This does... This returns... |
| `selectGraphicsForHighlight(selectionGraphics, selectionMode)` | This does... This returns... |
| `clearAllHighlightSelections()` | This does... This returns... |
| `playAnimation([animationStyle])` | This does... This returns... |
| `stopAnimation()` | This does... This returns... |

### Event Summary

| Event | Description |
| --- | --- |
| `click` | Extends [`GraphicsLayer click`](https://developers.arcgis.com/javascript/3/jsapi/graphicslayer-amd.html#event-click) and adds the following properties to the event object: `isOriginGraphic`, `true` if an origin graphic has been clicked, but `false` if a destination graphic has been clicked; `sharedOriginGraphics`, array of graphics that share the same origin; `sharedDestinationGraphics`, array of graphics that share the same destination. |
| `mouse-over` | Extends [`GraphicsLayer mouse-over`](https://developers.arcgis.com/javascript/3/jsapi/graphicslayer-amd.html#event-mouse-over) and adds the following properties to the event object: `isOriginGraphic`, `true` when the mouse first entered an origin graphic, but `false` when the mouse first entered a destination graphic; `sharedOriginGraphics`, array of graphics that share the same origin; `sharedDestinationGraphics`, array of graphics that share the same destination. |
