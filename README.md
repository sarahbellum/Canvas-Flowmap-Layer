# Canvas-Flowline-Layer

The Canvas-Flowline-Layer extends the Esri JSAPI to map the flow of objects from an origin point to a destination point by using a Bezier curve. Esri graphics are translated to pixel space so that rendering for the points and curves are mapped to the canvas.

## API

Extends JSAPI 3.x [esri/layers/GraphicsLayer](https://developers.arcgis.com/javascript/3/jsapi/graphicslayer-amd.html). All properties, methods, and events provided by the `GraphicsLayer` should be available in this `CanvasFlowlineLayer`.

## Purpose

Flow mapping is a cartographic necessity, yet still lacks empirical design rules (Jenny, et al. 2016). Common solutions for dynamic flow mapping include using straight lines and geodesic lines, both of which have immediate visual limitations. Using a Bezier curve where each curve on the map is created with the same formula benefits mappers twofold: 1) Aesthetics. While straight lines are not inherently ugly, an overlapping or convergence of them across a global dataset can be. A series of Bezier curves with the same formula, even when displaying an over-abundance, has a mathematical congruent flow which greatly improves the map's aesthetics  
![canvas](https://raw.githubusercontent.com/sarahbellum/Canvas-Flowline-Layer/jsapi3-canvas-layer/img/img_01.png?token=AJ3KYoQVAAU_r8tL5i3c3eNV5ltGZ_Fcks5YuIEjwA%3D%3D)  
2) Directional symbology. Whether the curve is convex or concave depends on the direction of the line. This symbology might be too new immediately intuit, however this rule is required for aesthetic veracity and consistency. The bonus is that after time, map readers can immediately know the direction of the flowline without having to add animation.  
![canvas](https://raw.githubusercontent.com/sarahbellum/Canvas-Flowline-Layer/jsapi3-canvas-layer/img/img_02.png?token=AJ3KYn8Q1u_Gh7isNNUfLG5WUxaTryz1ks5YuIFVwA%3D%3D)

## Constructor Summary

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

## Property Summary

| Property | Description |
| --- | --- |
| `originAndDestinationFieldIds` | **Required**. `Object`. This object informs the layer of your unique origin and destination attributes (fields). Both origins and destinations need to have their own unique ID attribute and geometry definition. [See example below](#originanddestinationfieldids-example) which includes minimum required object properties.  |
| `originCircleProperties` | _Optional_. `Object`. This object defines the properties of the origin point as rendered on the HTML Canvas. |
| `originHighlightCircleProperties` | _Optional_. `Object`. This object defines the properties of the origin point as rendered on the HTML Canvas when highlighted. |
| `destinationCircleProperties` | _Optional_. `Object`. This object defines the properties of the destination point as rendered on the HTML Canvas. |
| `destinationHighlightCircleProperties` | _Optional_. `Object`. This object defines the properties of the destination point as rendered on the HTML Canvas when highlighted. |
| `pathProperties` | _Optional_. `Object`. This object defines the properties of the non-animated Bezier curve that is drawn on the canvas connecting an origin points to a destination point. |
| `animatePathProperties` | _Optional_. `Object`. This defines the properties of the animated Bezier curve that is drawn on the canvas directly on top of the non-animated Bezier curve. [See Line Animation below ](#Line Animation)  |
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
## Line Animation
The convexity or concavity of the curve *does* convey the direction of the flowline, but the directionality won't be easily intuited due to its novelty. In the event that this mapping technique catches like wildfire, we can delete the second part of the previous sentence. In the mean time, we've added line animations, similar to the  "ants marching" effect, but with a nice easing inspired by [this Kirupa post](https://www.kirupa.com/html5/introduction_to_easing_in_javascript.htm). The Canvas-Flowline-Layer uses two separate lines when animation is added, although using two lines is not required to achieve animation. The first line is the solid static Bezier curve, and the second line is the dotted or hashed *animated* Bezier curve that sits on top of the first line.  
![canvas](https://raw.githubusercontent.com/sarahbellum/Canvas-Flowline-Layer/jsapi3-canvas-layer/img/lineanimation.gif?token=AJ3KYsi3ObT5Ep1gzRzY0GXAwuFEJ9Ovks5YuIFvwA%3D%3D)
## Method Summary

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

## Event Summary

| Event | Description |
| --- | --- |
| `click` | Extends [`GraphicsLayer click`](https://developers.arcgis.com/javascript/3/jsapi/graphicslayer-amd.html#event-click) and adds the following properties to the event object: `isOriginGraphic`, `true` if an origin graphic has been clicked, but `false` if a destination graphic has been clicked; `sharedOriginGraphics`, array of graphics that share the same origin; `sharedDestinationGraphics`, array of graphics that share the same destination. |
| `mouse-over` | Extends [`GraphicsLayer mouse-over`](https://developers.arcgis.com/javascript/3/jsapi/graphicslayer-amd.html#event-mouse-over) and adds the following properties to the event object: `isOriginGraphic`, `true` when the mouse first entered an origin graphic, but `false` when the mouse first entered a destination graphic; `sharedOriginGraphics`, array of graphics that share the same origin; `sharedDestinationGraphics`, array of graphics that share the same destination. |

## Options

### Data relationships
The examples show three different types of data relationships that can be used to add lines to the map: one-to-many; many-to-one; one-to-one, where the first part of these relationships indicate the origin ("one" or "many"), and the last part indicates the destination. There are three different csv files used for this implementation of the Canvas-Flowline-Layer, one for each data relationship type.
##### one-to-many
In the one-to-many csv file, the *one* or origin exists on several rows - one row for each of its destinations. Each destination in the one-to-many is only listed on one row, which is the same row as its origin. So the number of rows for each origin is determined by the number of destinations it supplies. In the image below, The city of Hechi and San Jose are both origins; Hechi supplies 9 destinations: Sahr, Tandil, Victorville, Cranbourne, Cuirco, Dahuk, Olympia, Oostanay, and Oran.  
![canvas](https://raw.githubusercontent.com/sarahbellum/Canvas-Flowline-Layer/jsapi3-canvas-layer/img/one-to-many.png?token=AJ3KYveLuEsb_hoML6UfDKiQydSm82vNks5YuIGqwA%3D%3D)
##### many-to-one
The many-to-one csv file for this implementation of the Canvas-Flowline-Layer is similar to the concept of the one-to-many csv file explained above. In the image below, many origin cities supply the one city of Hechi.  
![canvas](https://raw.githubusercontent.com/sarahbellum/Canvas-Flowline-Layer/jsapi3-canvas-layer/img/one-to-many.png?token=AJ3KYr_ELiXyKUyHTOCz4xRHaBdb3YD9ks5YuIHJwA%3D%3D)  
##### one-to-one
In the csv file for the one-to-one data relationship, each origin exists on one row only along with its one destination.  

#### Animation Properties
The animation property options provided are linear, ease-out, and ease-in. The default `animationStyle` can be changed, and the properties for the animation styles are changed with the `animatePathProperties`.  
#### Interactive Properties
You can change how users interact with this map by updating the requirements for how the Bezier curves appear and disappear.
