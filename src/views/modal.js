
import Backbone from 'backbone';
import { template } from 'lodash-es';

var templates = require('../templates');

module.exports = Backbone.View.extend({
  className: 'modal overlay',

  template: templates.modal,

  events: {
    'click .got-it': 'confirm'
  },

  initialize: function() {
    this.message = this.options.message;
  },

  render: function() {
    var modal = {
      message: this.message
    };
    this.$el.empty().append(template(templates.modal, {
      variable: 'modal'
    })(modal));

    return this;
  },

  confirm: function() {
    var view = this;
    this.$el.fadeOut('fast', function() {
      view.remove();
    });
    return false;
  }
});
