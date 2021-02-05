# Canvas-Flowmap-Layer

The **Canvas-Flowmap-Layer** extends the [ArcGIS API for JavaScript](https://developers.arcgis.com/javascript/) (Esri JSAPI) to map the flow of objects from an origin point to a destination point by using a Bezier curve. Esri graphics are translated to pixel space so that rendering for the points and curves are mapped to an [HTMLCanvasElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement).

If you are looking for **LeafletJS support**, there is a **Canvas-Flowmap-Layer** plugin available at [jwasilgeo/Leaflet.Canvas-Flowmap-Layer](https://www.github.com/jwasilgeo/Leaflet.Canvas-Flowmap-Layer).

Check out our [presentation from **NACIS 2017**](https://www.youtube.com/watch?v=cRPx-BfBtv0).

## Table of Contents

- [Demos](#demos)
- [Supported Web Mapping Libraries](#supported-web-mapping-libraries)
- [Purpose](#purpose)
- [Line Animation](#line-animation)
- [Features and Info for Cartographers and Developers](#features-and-info-for-cartographers-and-developers)
  - [Data Relationships](#data-relationships)
    - [one-to-many](#one-to-many)
    - [many-to-one](#many-to-one)
    - [one-to-one](#one-to-one)
  - [Animation](#animation)
  - [Interaction](#interaction)
  - [Symbology](#symbology)
- [Licensing](#licensing)

## Demos

Esri JSAPI v4

- [Simple demo](https://sarahbellum.github.io/Canvas-Flowmap-Layer/demos-jsapi-4/main)
- [Automatic rotation demo](https://sarahbellum.github.io/Canvas-Flowmap-Layer/demos-jsapi-4/rotate)
- [Automatic world wrapping](https://sarahbellum.github.io/Canvas-Flowmap-Layer/demos-jsapi-4/world-wrap)
- [Albers Alaska projection demo](https://sarahbellum.github.io/Canvas-Flowmap-Layer/demos-jsapi-4/albers-alaska-projection)
- [WGS84 projection demo](https://sarahbellum.github.io/Canvas-Flowmap-Layer/demos-jsapi-4/wgs84-projection)

Esri JSAPI v3

- [Simple demo](https://sarahbellum.github.io/Canvas-Flowmap-Layer/demos-jsapi-3/main)
- [Feature comparison / sandbox demo](https://sarahbellum.github.io/Canvas-Flowmap-Layer/demos-jsapi-3/comparison/)

## Supported JavaScript Web Mapping Libraries

- Detailed documentation for **Esri JSAPI v4** is available at [README-JSAPI-4](./README-JSAPI-4.md).

- Detailed documentation for **Esri JSAPI v3** is available at [README-JSAPI-3](./README-JSAPI-3.md).

- If you are looking for **LeafletJS support**, there is a Canvas-Flowmap-Layer plugin available at [jwasilgeo/Leaflet.Canvas-Flowmap-Layer](https://www.github.com/jwasilgeo/Leaflet.Canvas-Flowmap-Layer).

## Purpose

Flow mapping is a cartographic necessity, yet still lacks empirical design rules [(Jenny, et al. 2016)](https://www.researchgate.net/publication/311588861_Design_principles_for_origin-destination_flow_maps). Common solutions for dynamic flow mapping include using straight lines and geodesic lines, both of which have immediate visual limitations. Using a Bezier curve for flow map lines, where each curve on the map is created with the same formula benefits mappers twofold:

**1. Aesthetics.** While straight lines are not inherently ugly, an overlapping or convergence of them across a global dataset can be. A series of Bezier curves created with the same formula, even when displaying an over-abundance, has a mathematical congruent flow which greatly improves the map's aesthetics.

![canvas](https://raw.githubusercontent.com/sarahbellum/Canvas-Flowmap-Layer/master/img/img_01.png)

**2. Directional symbology.** Whether the curve is convex or concave depends on the direction of the line. This symbology might be too new immediately intuit, however this rule is required for aesthetic veracity and consistency. The bonus is that map readers can immediately know the direction of the line without having to add animation.

![canvas](https://raw.githubusercontent.com/sarahbellum/Canvas-Flowmap-Layer/master/img/img_02.png)

## Line Animation

The convexity or concavity of the curve *does* convey the direction of the flow line, but the directionality won't be easily intuited due to its novelty. In the event that this mapping technique catches like :fire: wildfire :fire:, we can delete the second part of the previous sentence. In the mean time, we've added line animations, similar to the  "ants marching" effect, but with many nice easing effects inspired by both the [tween.js library](https://github.com/tweenjs/tween.js) and this [Kirupa post](https://www.kirupa.com/html5/introduction_to_easing_in_javascript.htm).

The Canvas-Flowmap-Layer uses two separate lines when animation is added, although using two lines is not required to achieve animation. The first line is the solid, static Bezier curve, and the second line is the dotted or hashed *animated* Bezier curve that sits on top of the static line.

![canvas](https://raw.githubusercontent.com/sarahbellum/Canvas-Flowmap-Layer/master/img/lineanimation.gif)

## Features and Info for Cartographers and Developers

### Data Relationships

The demo pages provided in this repository show three different types of data relationships that can be used to add lines to the map: one-to-many; many-to-one; one-to-one, where the first part of these relationships indicate the origin ("one" or "many"), and the last part indicates the destination. There are three different csv files used for our demo pages of the Canvas-Flowmap-Layer, one for each data relationship type.

#### one-to-many

In the one-to-many csv file, the *one* or origin exists on several rows - one row for each of its destinations. Each destination in the one-to-many is only listed on one row, which is the same row as its origin. So the number of rows for each origin is determined by the number of destinations it supplies. In the image below, The city of Hechi and San Jose are both origins; Hechi supplies 9 destinations: Sahr, Tandil, Victorville, Cranbourne, Cuirco, Dahuk, Olympia, Oostanay, and Oran.

![data-screenshot](https://raw.githubusercontent.com/sarahbellum/Canvas-Flowmap-Layer/master/img/one-to-many.png)

#### many-to-one

The many-to-one csv file for this implementation of the Canvas-Flowmap-Layer is similar to the concept of the one-to-many csv file explained above. In the image below, many origin cities supply the one city of Hechi.

![data-screenshots](https://raw.githubusercontent.com/sarahbellum/Canvas-Flowmap-Layer/master/img/many-to-one.png)

#### one-to-one

In the csv file for the one-to-one data relationship, each origin exists on one row only along with its one destination.

### Animation

The animations rely on the [tween.js library](https://github.com/tweenjs/tween.js) to assist with changing the underlying line property values as well as providing many different easing functions and durations. See the `setAnimationDuration()` and `setAnimationEasing()` method descriptions below for more information.

### Interaction

You can change how users interact with the `CanvasFlowmapLayer` by controlling which Bezier curves appear and disappear at any time. The demos we provide show how to do this in several ways with JSAPI `click` and `mouse-over` events, coupled with using this layer's `selectGraphicsForPathDisplay` method.

For example, you could listen for a `click` event and then choose to either add to your "selection" of displayed Bezier curves, subtract from your selection, or establish a brand new selection. Alternatively, you can set the `pathDisplayMode` to `'all'` when constructing the layer to display every Bezier curve at once.

### Symbology

The Canvas-Flowmap-Layer has default symbology established for origin points, destination points, Bezier curves, and animated Bezier curves. You can change these defaults using the various symbol configuration objects (e.g. `originCircleProperties`, `destinationCircleProperties`, `pathProperties`, `animatePathProperties`, etc.).

Symbol configurations are defined using property objects inspired by the [ArcGIS REST API renderer objects](https://resources.arcgis.com/en/help/arcgis-rest-api/#/Renderer_objects/02r30000019t000000/) specification. Simple, unique value, and class breaks are all supported but instead use canvas stroke and line style property names.

See more API documentation info within [README-JSAPI-3 "custom symbology examples" section](./README-JSAPI-3.md#properties) and [README-JSAPI-4](./README-JSAPI-4.md).

## Licensing

A copy of the license is available in the repository's [LICENSE](./LICENSE) file.
