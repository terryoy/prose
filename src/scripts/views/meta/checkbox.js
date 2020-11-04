
import Backbone from 'backbone';

import { bindAll, template } from 'lodash-es';

import templates from '../../templates';

module.exports = Backbone.View.extend({

    template: templates.meta.checkbox,
    type: 'checkbox',

    initialize: function(options) {
        this.options = options;
        bindAll(this, ['render', 'getValue', 'setValue']);
    },

    render: function() {
        var options = this.options;
        var checkbox = {
            name: options.name,
            label: options.field.label,
            help: options.field.help,
            value: options.name,
            checked: options.field.value
        };

        this.setElement($(template(this.template, {
            variable: 'meta'
        })(checkbox)));
        this.$form = this.$el.find('input');
        return this.$el;
    },

    getValue: function() {
        return this.$form[0].checked;
    },

    setValue: function(value) {
        this.$form[0].checked = value;
    },
});
