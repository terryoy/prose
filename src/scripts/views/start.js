
import Backbone from 'backbone';
import { template } from 'lodash-es';

import templates from '../templates';
import { Config } from '../config';
import { cookie } from '../storage/cookie';
import Router from '../router';

// Set scope
Config.scope = cookie.get('scope') || 'repo';

module.exports = Backbone.View.extend({
  id: 'start',

  initialize: function () {
    this.persistScope(Config.scope);
  },

  events: {
    'click a[href="#scopes"]': 'toggleScope',
    'change .toggle-hide select': 'setScope'
  },

  template: templates.start,

  render: function() {
    // this.$el.html(template(this.template, {variable: 'auth'})(auth));
    this.$el.html(template(this.template, {variable: 'auth'})(Config));
    return this;
  },

  toggleScope: function(e) {
    e.preventDefault();
    this.$('.toggle-hide').toggleClass('show');
  },

  setScope: function(e) {
    var scope = $(e.currentTarget).val();
    this.persistScope(scope);
    this.render();
    Router.app.nav.render();
  },

  persistScope: function(scope) {
    var expire = new Date((new Date()).setYear((new Date()).getFullYear() + 20));
    Config.scope = scope;
    cookie.set('scope', scope, expire);
  }
});
