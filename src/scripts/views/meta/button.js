import Backbone from 'backbone';
import { template } from 'lodash-es';

import templates from '../../templates';

export default class Button extends Backbone.View {
    template = templates.meta.button;

    type = 'button';

    // events = {
    //   'click button': 'toggleState',
    // }

    constructor(options) {
      super({
        events: {
          'click button': 'toggleState',
        },
        ...options
      });
      this.options = options;
      this.on = options.field.on;
      this.off = options.field.off;
    }

    toggleState = () => {
      const val = this.$form.val() === this.on
        ? this.off : this.on;
      this.$form.val(val).text(val);
    }

    getValue = () => this.$form.val() === this.on

    // Sets value to false if user gives anything except
    // the string equivalent of on.
    setValue = (value) => {
      this.$form.val(value === this.on);
    }

    // default value is on, or true.
    render = () => {
      const { options } = this;
      const button = {
        name: options.name,
        label: options.field.label,
        help: options.field.help,
        on: options.field.on,
        off: options.field.off,
        value: options.field.on,
      };

      this.setElement($(template(this.template, {
        variable: 'meta',
      })(button)));
      this.$form = this.$el.find('button');
      return this.$el;
    }
}
