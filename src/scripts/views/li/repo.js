

import Backbone from 'backbone';
import { extend, template } from 'lodash-es';

import { cookie } from '../../storage/cookie';
import templates from '../../templates';

module.exports = Backbone.View.extend({
    tagName: 'li',

    className: 'item clearfix',

    template: templates.li.repo,

    initialize: function(options) {
        this.model = options.model;
        this.$el.attr('data-index', options.index);
        this.$el.attr('data-id', this.model.id);
        this.$el.attr('data-navigate', '#' + this.model.get('owner').login + '/' + this.model.get('name'));
    },

    render: function() {
        var data = extend(this.model.attributes, {
            login: cookie.get('login')
        });

        this.$el.empty().append(template(this.template, {
            variable: 'repo'
        })(data));

        return this;
    }
});
