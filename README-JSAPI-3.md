# Canvas-Flowmap-Layer for Esri JSAPI v3

## Table of Contents

- [Demos](#demos)
- [Developer API](#developer-api)
  - [Constructor](#constructor)
  - [Properties](#properties)
  - [Methods](#methods)
  - [Events](#events)

## Demos

- [Simple demo](https://sarahbellum.github.io/Canvas-Flowmap-Layer/demos-jsapi-3/main)
- [Feature comparison, sandbox demo](https://sarahbellum.github.io/Canvas-Flowmap-Layer/demos-jsapi-3/comparison/)

## Developer API

This extends the Esri JSAPI v3 [`esri/layers/GraphicsLayer`](https://developers.arcgis.com/javascript/3/jsapi/graphicslayer-amd.html). All properties, methods, and events provided by the `GraphicsLayer` are available in the `CanvasFlowmapLayer`, with customizations and extentions described below.

### Constructor

```javascript
// an example of constructing a new layer
var canvasFlowmapLayer = new CanvasFlowmapLayer({
  // 1. a required property
  // inform the layer of your unique origin/destination attributes and geometry fields
  originAndDestinationFieldIds: {
    // all kinds of important stuff here...see docs below
  },

  // 2. some optional properties
  pathDisplayMode: 'selection',
  animationStarted: true,
  animationDuration: 2000,
  animationEasingFamily: 'Cubic',
  animationEasingType: 'In'

  // 3. JSAPI GraphicsLayer constructor properties can also be used
  id: 'myCanvasFlowmapLayer',
  visible: true
});

// construct an array of esri/Graphic yourself and add them to the layer
canvasFlowmapLayer.addGraphics([pointGraphic1, pointGraphic2, ..., pointGraphic100]);

// add the layer to your JSAPI map
map.addLayer(canvasFlowmapLayer);
```

**Convenience options available in constructor _only_:**

| Property | Description |
| --- | --- |
| `animationDuration` | See `setAnimationDuration()` method description below. |
| `animationEasingFamily` | See `setAnimationEasing()` method description below. |
| `animationEasingType` | See `setAnimationEasing()` method description below. |

### Properties

| Property | Description |
| --- | --- |
| `originAndDestinationFieldIds` | **Required**. `Object`. This object informs the layer of your unique origin and destination attributes (fields). Both origins and destinations need to have their own unique ID attribute and geometry definition. [See example below](#originanddestinationfieldids-example) which includes minimum required object properties. |
| `originCircleProperties` | _Optional_. `Object`. This object defines the symbol properties of the origin point as rendered on the canvas. |
| `destinationCircleProperties` | _Optional_. `Object`. This object defines the symbol properties of the destination point as rendered on the canvas. |
| `pathProperties` | _Optional_. `Object`. This object defines the symbol properties of the non-animated Bezier curve that is drawn on the canvas connecting an origin point to a destination point. |
| `animatePathProperties` | _Optional_. `Object`. This defines the symbol properties of the animated Bezier curve that is drawn on the canvas directly on top of the non-animated Bezier curve. [See Line Animation info above](#line-animation). |
| `pathDisplayMode` | _Optional_. `String`. Valid values: `'selection'` or `'all'`. Defaults to `'all'`. |
| `wrapAroundCanvas` | _Optional_. `Boolean`. Defaults to `true`. Ensures that canvas features will be drawn beyond +/-180 longitude. |
| `animationStarted` | _Optional_. `Boolean`. Defaults to `false`. This can be set during construction, but you should use the `playAnimation` and `stopAnimation` methods to control and change animations after layer construction. |
| `originHighlightCircleProperties` | _Optional_. `Object`. This object defines the symbol properties of the origin point as rendered on the canvas when highlighted. |
| `destinationHighlightCircleProperties` | _Optional_. `Object`. This object defines the symbol properties of the destination point as rendered on the canvas when highlighted. |

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

**custom symbology examples:**

<details>
  <summary>
    `destinationCircleProperties` example to set categorical (unique values) symbols for destination circle strokes and fills
  </summary>

```javascript
destinationCircleProperties: {
  type: 'uniqueValue',
  field: '<field / column / property name>',
  uniqueValueInfos: [{
    value: '<attribute value A>',
    symbol: {
      globalCompositeOperation: 'destination-over',
      radius: 10,
      fillStyle: 'rgba(87, 216, 255, 0.65)',
      lineWidth: 0.5,
      strokeStyle: 'rgb(61, 225, 255)',
      shadowBlur: 0
    }
  }, {
    value: '<attribute value B>',
    symbol: {
      globalCompositeOperation: 'destination-over',
      radius: 8,
      fillStyle: 'rgba(153, 98, 204, 0.70)',
      lineWidth: 0.5,
      strokeStyle: 'rgb(181, 131, 217)',
      shadowBlur: 0
    }
  }]
}
```

</details>

<details>
  <summary>
    `pathProperties` example to set a simple (single) symbol for line width and color
  </summary>

```javascript
pathProperties: {
  type: 'simple',
  symbol: {
    strokeStyle: 'rgba(207, 241, 17, 0.8)',
    shadowBlur: 1.5,
    lineWidth: 0.5,
    shadowColor: 'rgb(207, 241, 17)',
    lineCap: 'round'
  }
}
```

</details>

<details>
  <summary>
    `pathProperties` example to set class break symbols for line widths and colors
  </summary>

```javascript
pathProperties: {
  type: 'classBreaks',
  field: '<field / column / property name>',
  defaultSymbol: {
    strokeStyle: 'rgba(237, 248, 177, 1)',
    lineWidth: 0.5,
    lineCap: 'round'
  },
  classBreakInfos: [{
    classMinValue: 0,
    classMaxValue: 999999,
    symbol: {
      strokeStyle: 'rgba(237, 248, 177, 1)',
      lineWidth: 0.5,
      lineCap: 'round'
    }
  }, {
    classMinValue: 999999,
    classMaxValue: 4999999,
    symbol: {
      strokeStyle: 'rgba(127, 205, 187, 1)',
      lineWidth: 1.5,
      lineCap: 'round'
    }
  }, {
    classMinValue: 5000000,
    classMaxValue: 10000000,
    symbol: {
      strokeStyle: 'rgba(44, 127, 184, 1)',
      lineWidth: 3,
      lineCap: 'round'
    }
  }]
}
```

</details>

### Methods

| Method | Arguments | Description |
| --- | --- | --- |
| `addGraphics( inputGraphics )` | `inputGraphics`: `Array` of Esri graphics. | This method will prove to be one of your best friends. It is the main "entry point" for adding to the layer the origin-destination graphics you are responsible for creating from your own data source. |
| `selectGraphicsForPathDisplay( selectionGraphics, selectionMode )`  | `selectionGraphics`: `Array` of Esri graphics that were already added to the layer. <br/> <br/> `selectionMode`: `String`. Valid values: `'SELECTION_NEW'`, `'SELECTION_ADD'`, or `'SELECTION_SUBTRACT'`. | This informs the layer which Bezier curves should be drawn on the map. <br/><br/> For example, you can most easily use this in conjunction with a `click` or `mouse-over` event listener. |
| `selectGraphicsForPathDisplayById( uniqueOriginOrDestinationIdField, idValue, originBoolean, selectionMode )` |  | This is a convenience method if the unique origin or destination value is already known and you do not wish to rely on a `click` or `mouse-over` event listener. |
| `clearAllPathSelections()` |  | This informs the layer to unselect (and thus hide) all Bezier curves. |
| `playAnimation()` |  | This starts and shows Bezier curve animations. |
| `stopAnimation()` |  | This stops and hides any Bezier curve animations. |
| `setAnimationDuration( duration )` | `duration`: _Optional_. `Number` in milliseconds. | This changes the animation duration. |
| `setAnimationEasing( easingFamily, easingType )` | `easingFamily`: `String`. <br/><br/> `easingType`: `String`. <br/><br/> See `getAnimationEasingOptions()` method for info on valid values. | This changes the animation easing function with the help of the [tween.js library](https://github.com/tweenjs/tween.js). |
| `getAnimationEasingOptions()` |  | Returns information on valid `easingFamily` and `easingType` values based on the [tween.js library](https://github.com/tweenjs/tween.js). |
| `selectGraphicsForHighlight( selectionGraphics, selectionMode )` | `selectionGraphics`: `Array` of Esri graphics that were already added to the layer. <br/><br/> `selectionMode`: `String`. Valid values: `'SELECTION_NEW'`, `'SELECTION_ADD'`, or `'SELECTION_SUBTRACT'`. | This informs the layer which origin/destination points should be "highlighted" when drawn on the map, which just applies the highlight symbology instead of the default symbology to the points. <br/><br/> For example, you can most easily use this in conjunction with a `click` or `mouse-over` event listener. |
| `clearAllHighlightSelections()` |  | This informs the layer to "un-highlight" (and thus remove highlight symbology) all Bezier curves. |

### Events

| Event | Description |
| --- | --- |
| `click` | Extends [GraphicsLayer `click`](https://developers.arcgis.com/javascript/3/jsapi/graphicslayer-amd.html#event-click) and adds the following properties to the event object: <br/><br/> `isOriginGraphic`: `true` if an origin graphic has been clicked, but `false` if a destination graphic has been clicked. <br/><br/> `sharedOriginGraphics`: `Array` of Esri graphics that share the same origin. <br/><br/> `sharedDestinationGraphics`: `Array` of Esri graphics that share the same destination. |
| `mouse-over` | Extends [GraphicsLayer `mouse-over`](https://developers.arcgis.com/javascript/3/jsapi/graphicslayer-amd.html#event-mouse-over) and adds the following properties to the event object: <br/><br/> `isOriginGraphic`: `true` when the mouse first entered an origin graphic, but `false` when the mouse first entered a destination graphic. <br/><br/> `sharedOriginGraphics`: `Array` of Esri graphics that share the same origin. <br/><br/> `sharedDestinationGraphics`: `Array` of Esri graphics that share the same destination. |
