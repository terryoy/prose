import Backbone from 'backbone';
import { template } from 'lodash-es';

import templates from '../../templates';

export class Text extends Backbone.View {
    template = templates.meta.text;

    type = 'text';

    constructor(options) {
      super(options);
      this.options = options;
    }

    getValue = () => (this.options.type === 'number'
      ? Number(this.$form.val()) : this.$form.val())

    setValue = (value) => {
      this.$form.val(value);
    }

    render = () => {
      const { options } = this;

      const text = {
        name: options.name,
        label: options.field.label,
        help: options.field.help,
        value: options.field.value,
        placeholder: options.field.placeholder,
        type: options.type,
      };

      this.setElement($(template(this.template, {
        variable: 'meta',
      })(text)));
      this.$form = this.$el.find('input');
      return this.$el;
    }
}
