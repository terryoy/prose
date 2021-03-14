import Backbone from 'backbone';

import { bindAll, template } from 'lodash-es';

import templates from '../../templates';

export default class Checkbox extends Backbone.View {
  template = templates.meta.checkbox;

  type = 'checkbox';

  constructor(options) {
    super(options);
    this.options = options;
    bindAll(this, ['render', 'getValue', 'setValue']);
  }

  getValue = () => this.$form[0].checked

  setValue = (value) => {
    this.$form[0].checked = value;
  }

  render = () => {
    const { options } = this;
    const checkbox = {
      name: options.name,
      label: options.field.label,
      help: options.field.help,
      value: options.name,
      checked: options.field.value,
    };

    this.setElement($(template(this.template, {
      variable: 'meta',
    })(checkbox)));
    this.$form = this.$el.find('input');
    return this.$el;
  }
}
