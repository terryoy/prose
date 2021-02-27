import Backbone from 'backbone';

import { template, isArray } from 'lodash-es';
import templates from '../../templates';

export default class MultiSelect extends Backbone.View {
    template = templates.meta.multiselect;

    type = 'multiselect';

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
      let values = isArray(value) ? value : [value];
      values = values.filter((value) =>
        // make sure we accept values of 0
        Boolean(value) || value === 0);
      if (!values.length) {
        $el.find('option').each(function () {
          $(this).attr('selected', false);
        });
      } else {
        values.forEach((v) => {
          const match = $el.find(`option[value="${v}"]`);
          if (match.length) {
            match.attr('selected', 'selected');
          }
          // add the value as an option if none exists
          else {
            $form.append($('<option />', { selected: 'selected', value: v, text: v }));
          }
        });
      }
      $form.trigger('liszt:updated');
    }

    // TODO write tests for alterable behavior.
    // TODO write tests for multiselect behavior.
    render = () => {
      const { options } = this;
      const multiselect = {
        name: options.name,
        label: options.field.label,
        help: options.field.help,
        alterable: options.field.alterable,
        placeholder: options.field.placeholder,
        options: options.field.options,
        lang: options.lang,
      };

      if (Array.isArray(options.field.value)) {
        multiselect.value = options.field.value;
      } else if (typeof options.field.value !== 'undefined' && typeof options.field.value !== 'object') {
        multiselect.value = [options.field.value];
      } else {
        multiselect.value = [];
      }

      this.setElement($(template(this.template, {
        variable: 'meta',
      })(multiselect)));
      this.$form = this.$el.find('select');
      return this.$el;
    }
}
