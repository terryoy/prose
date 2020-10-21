import Backbone from 'backbone';
import { escape } from 'lodash-es';

module.exports = Backbone.View.extend({
  tagName: 'option',

  initialize: function(options) {
    this.model = options.model;
    this.repo = options.repo;
    this.branch = options.branch;
  },

  render: function() {
    this.$el.val('#' + [ this.repo.get('owner').login, this.repo.get('name'), 'tree', this.model.get('name') ].join('/'));
    this.el.selected = this.branch && this.branch === this.model.get('name');

    this.$el.html(escape(this.model.get('name')));

    return this;
  }
});
