

import Backbone from 'backbone';
import { bindAll, defer, template } from 'lodash-es';

var templates = require('../templates');

module.exports = Backbone.View.extend({
  template: templates.loading,

  initialize: function () {
    bindAll(this, ['start', 'stop', 'done', 'render']);
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
    defer((function() {
      this.queue--;
      if (this.queue < 1) this.stop();
    }).bind(this));
  },

  render: function() {
    this.$el.html(template(this.template)());
    return this;
  }
});
