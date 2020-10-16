var $ = require('jquery-browserify');
var _ = require('lodash');
var Backbone = require('backbone');
var templates = require('../../dist/templates');

module.exports = Backbone.View.extend({
  template: templates.loading,

  initialize: function () {
    _.bindAll(this, ['start', 'stop', 'done', 'render']);
  },

  queue: 0,

  start: function(message) {
    this.queue++;

    if (message) {
      this.$el.find('.message').html(message);
    }

    this.$el.show();
  },

  stop: function() {
    this.queue = 0;
    this.$el.fadeOut(150);
  },

  done: function() {
    _.defer((function() {
      this.queue--;
      if (this.queue < 1) this.stop();
    }).bind(this));
  },

  render: function() {
    this.$el.html(_.template(this.template)());
    return this;
  }
});
