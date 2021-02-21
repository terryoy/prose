import Backbone from 'backbone';
import { template } from 'lodash-es';

import templates from '../../templates';

module.exports = Backbone.View.extend({
    className: 'inner',

    template: templates.sidebar.drafts,

    initialize: function(options) {
        this.link = options.link;
        this.sidebar = options.sidebar;
    },

    render: function() {
        this.$el.html(template(this.template, {
            variable: 'link'
        })(this.link));

        this.sidebar.open();

        return this;
    }
});
