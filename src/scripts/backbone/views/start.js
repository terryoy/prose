import Backbone from 'backbone';
import { template } from 'lodash-es';

import templates from '../templates';
import { Config } from '../config';
import { cookie } from '../storage/cookie';
import Router from '../router';

// Set scope
Config.scope = cookie.get('scope') || 'repo';

export default class StartView extends Backbone.View {
  id = 'start';

  template = templates.start;

  events = {
    'click a[href="#scopes"]': 'toggleScope',
    'change .toggle-hide select': 'setScope',
  }

  initialize() {
    this.persistScope(Config.scope);
  }

  toggleScope(e) {
    e.preventDefault();
    this.$('.toggle-hide').toggleClass('show');
  }

  setScope(e) {
    const scope = $(e.currentTarget).val();
    this.persistScope(scope);
    this.render();
    Router.app.nav.render();
  }

  persistScope(scope) {
    const expire = new Date((new Date()).setYear((new Date()).getFullYear() + 20));
    Config.scope = scope;
    cookie.set('scope', scope, expire);
  }

  render() {
    // this.$el.html(template(this.template, {variable: 'auth'})(auth));
    this.$el.html(template(this.template, { variable: 'auth' })(Config));
    return this;
  }
}
