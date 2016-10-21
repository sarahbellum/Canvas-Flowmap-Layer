define([], function() {
  return {
    cityToCityLayer: {
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
      },

      // canvas symbol properties are based on Esri REST API simple renderer and unique value renderer specifications
      // http://resources.arcgis.com/en/help/arcgis-rest-api/#/Renderer_objects/02r30000019t000000/
      originCircleProperties: {
        type: 'simple',
        symbol: {
          globalCompositeOperation: 'destination-over',
          radius: 5,
          fillStyle: 'rgba(250, 140, 44, 0.47)',
          lineWidth: 1,
          strokeStyle: 'rgba(255, 137, 0, 0.6)',
          shadowBlur: 0
        }
      },

      originHighlightCircleProperties: {
        type: 'simple',
        symbol: {
          globalCompositeOperation: 'destination-over',
          radius: 5.5,
          fillStyle: 'rgba(250, 140, 44, 0.47)',
          lineWidth: 4,
          strokeStyle: 'rgb(255, 0, 51)',
          shadowBlur: 0
        }
      },

      destinationCircleProperties: {
        type: 'simple',
        symbol: {
          globalCompositeOperation: 'destination-over',
          radius: 8,
          fillStyle: 'rgba(87, 216, 255, 0.5)',
          lineWidth: 0.5,
          strokeStyle: 'rgb(61, 225, 255)',
          shadowBlur: 0
        }
      },

      destinationHighlightCircleProperties: {
        type: 'simple',
        symbol: {
          globalCompositeOperation: 'destination-over',
          radius: 8,
          fillStyle: 'rgba(87, 216, 255, 0.5)',
          lineWidth: 6,
          strokeStyle: 'rgb(255, 0, 51)',
          shadowBlur: 0
        }
      },

      pathProperties: {
        type: 'simple',
        symbol: {
          strokeStyle: 'rgba(255, 0, 51, 0.5)',
          shadowBlur: 2,
          shadowColor: 'rgb(255, 0, 51)',
          lineCap: 'round'
        }
      },

      csvAttributeDefinitions: [{
        name: 's_city_id',
        type: 'Number'
      }, {
        name: 's_city',
        type: 'String'
      }, {
        name: 's_lon',
        type: 'Number'
      }, {
        name: 's_lat',
        type: 'Number'
      }, {
        name: 'e_city_id',
        type: 'Number'
      }, {
        name: 'e_City',
        type: 'String'
      }, {
        name: 'e_lon',
        type: 'Number'
      }, {
        name: 'e_lat',
        type: 'Number'
      }]
    }
  };
});

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
