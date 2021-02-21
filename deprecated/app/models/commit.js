var _ = require('lodash');
var Backbone = require('backbone');

module.exports = Backbone.Model.extend({
  initialize: function(attributes, options) {
    this.repo = attributes.repo;
  },

  url: function() {
    return this.repo.url() + '/commits/' + this.get('sha');
  }
});
