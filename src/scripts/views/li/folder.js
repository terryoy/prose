

import Backbone from 'backbone';
import { extend, template } from 'lodash-es';

import templates from '../../templates';

module.exports = Backbone.View.extend({
    tagName: 'li',

    className: 'item clearfix',

    template: templates.li.folder,

    initialize: function(options) {
        this.model = options.model;
        this.repo = options.repo;
        this.branch = options.branch;

        this.$el.attr('data-index', options.index);
        this.$el.attr('data-navigate', '#' + this.repo.get('owner').login + '/' +
      this.repo.get('name') + '/tree/' + this.branch + '/' +
      this.model.get('path'));
    },

    render: function() {
        var data = extend(this.model.attributes, {
            branch: this.branch,
            repo: this.repo.attributes
        });

        var rooturl = this.model.collection.config &&
      this.model.collection.config.rooturl;
        var regex = new RegExp('^' + rooturl + '(.*)');
        var jailpath = rooturl ? data.path.match(regex) : false;

        data.jailpath = jailpath ? jailpath[1] : data.path;

        this.$el.empty().append(template(this.template, {
            variable: 'folder'
        })(data));

        return this;
    }
});
