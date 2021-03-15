import Backbone from 'backbone';

import { template, isArray } from 'lodash-es';
import templates from '../../templates';

export default class Select extends Backbone.View {
    template = templates.meta.select;

    type = 'select';

    constructor(options) {
      super(options);
      this.options = options;
    }

    getValue = () => {
      const val = this.$form.val();
      if (!val && val !== 0) {
        return '';
      }
      return val;
    }

    setValue = (value) => {
      const { $el } = this;
      const { $form } = this;
      if (isArray(value)) {
        value = value[0];
      }
      if (!value && value !== 0) {
        $el.find('option').each(function () {
          $(this).attr('selected', false);
        });
      } else {
        const match = $el.find(`option[value="${value}"]`);
        if (match.length) {
          match.attr('selected', 'selected');
          $form.trigger('liszt:updated');
        } else {
          $form.append($('<option />', { selected: 'selected', value, text: value }));
        }
      }
      $form.trigger('liszt:updated');
    }

    render = () => {
      const { options } = this;
      const select = {
        name: options.name,
        label: options.field.label,
        help: options.field.help,
        placeholder: options.field.placeholder,
        options: options.field.options,
        value: options.field.value,
        lang: options.lang,
      };

      this.setElement($(template(this.template, {
        variable: 'meta',
      })(select)));
      this.$form = this.$el.find('select');
      return this.$el;
    }
}
