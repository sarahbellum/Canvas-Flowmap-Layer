define([
  'dojo/_base/lang',
  'dojo/_base/declare'
], function(
  lang, declare
) {
  return declare([], {
    constructor: function(options) {
      this.inherited(arguments);
      lang.mixin(this, options);
    }
  });
});
