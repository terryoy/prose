
import Backbone from 'backbone';
import { bindAll, template } from 'lodash-es';

var templates = require('../../templates');

module.exports = Backbone.View.extend({

  template: templates.meta.text,
  type: 'text',

  initialize: function(options) {
    this.options = options;
    bindAll(this, ['render', 'getValue', 'setValue']);
  },

  render: function () {
    var options = this.options;

    var text = {
      name: options.name,
      label: options.field.label,
      help: options.field.help,
      value: options.field.value,
      placeholder: options.field.placeholder,
      type: options.type
    };

    this.setElement($(template(this.template, {
      variable: 'meta'
    })(text)));
    this.$form = this.$el.find('input');
    return this.$el;
  },

  getValue: function() {
    return this.options.type === 'number' ?
      Number(this.$form.val()) : this.$form.val();
  },

  setValue: function(value) {
    this.$form.val(value);
  }

});
