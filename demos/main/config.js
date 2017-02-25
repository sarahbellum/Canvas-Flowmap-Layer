define([], function() {
  return {

    // required information to inform the CanvasFlowmapLayer which origin and destination attributes to rely on
    originAndDestinationFieldIds: {
      // use this origin attribute to help filter unique graphics when clicking
      originUniqueIdField: 's_city_id',
      originGeometry: {
        x: 's_lon',
        y: 's_lat',
        spatialReference: {
          wkid: 4326
        }
      },
      // use this destination attribute to refrain from re-drawing identical destination graphics
      // i.e. only show 1 destination per each unique entry in the csv in the canvas
      destinationUniqueIdField: 'e_city_id',
      destinationGeometry: {
        x: 'e_lon',
        y: 'e_lat',
        spatialReference: {
          wkid: 4326
        }
      }
    }

  };
});

// EXAMPLE OF PATH PROPERTIES WITH A SIMPLE (SINGLE) SYMBOL:

// pathProperties: {
//   type: 'simple',
//   symbol: {
//     strokeStyle: 'rgba(207, 241, 17, 0.8)',
//     shadowBlur: 1.5,
//     lineWidth: 0.5,
//     shadowColor: 'rgb(207, 241, 17)',
//     lineCap: 'round'
//   }
// }

// EXAMPLE OF DESTINATION POINT SYMBOL PROPERTIES WITH CATEGORICAL/UNIQUE VALUES:

// destinationCircleProperties: {
//   type: 'uniqueValue',
//   field: '<fieldName>',
//   uniqueValueInfos: [{
//     value: '<attributeValueA>',
//     symbol: {
//       globalCompositeOperation: 'destination-over',
//       radius: 10,
//       fillStyle: 'rgba(87, 216, 255, 0.65)',
//       lineWidth: 0.5,
//       strokeStyle: 'rgb(61, 225, 255)',
//       shadowBlur: 0
//     }
//   }, {
//     value: '<attributeValueB>',
//     symbol: {
//       globalCompositeOperation: 'destination-over',
//       radius: 8,
//       fillStyle: 'rgba(153, 98, 204, 0.70)',
//       lineWidth: 0.5,
//       strokeStyle: 'rgb(181, 131, 217)',
//       shadowBlur: 0
//     }
//   }]
// }

// EXAMPLE OF LINE SYMBOL PROPERTIES WITH CLASS BREAK VALUES:

// pathProperties: {
//   type: 'classBreaks',
//   field: 's_Volume',
//   defaultSymbol: {
//     strokeStyle: 'rgba(237, 248, 177, 1)',
//     lineWidth: 0.5,
//     lineCap: 'round'
//   },
//   classBreakInfos: [{
//     classMinValue: 0,
//     classMaxValue: 999999,
//     symbol: {
//       strokeStyle: 'rgba(237, 248, 177, 1)',
//       lineWidth: 0.5,
//       lineCap: 'round'
//     }
//   }, {
//     classMinValue: 999999,
//     classMaxValue: 4999999,
//     symbol: {
//       strokeStyle: 'rgba(127, 205, 187, 1)',
//       lineWidth: 1.5,
//       lineCap: 'round'
//     }
//   }, {
//     classMinValue: 5000000,
//     classMaxValue: 10000000,
//     symbol: {
//       strokeStyle: 'rgba(44, 127, 184, 1)',
//       lineWidth: 3,
//       lineCap: 'round'
//     }
//   }]
// }
