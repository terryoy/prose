import Backbone from 'backbone';
import { template, invoke } from 'lodash-es';
import key from 'keymaster';

import { cookie } from '../storage/cookie';
import templates from '../templates';
import util from '../util';

import LoaderView from './loader';
import SidebarView from './sidebar';
import NavView from './nav';

export default class Application extends Backbone.View {
  template = templates.app;

  subviews = {};

  events = {
    'click a.logout': 'logout',
  };

  constructor(options) {
    super(options);

    // initialize() will be triggered in super constructor...

    this.user = options.user;

    // Loader
    this.loader = new LoaderView();
    this.subviews.loader = this.loader;

    // Sidebar
    this.sidebar = new SidebarView({
      app: this,
      user: this.user,
    });
    this.subviews.sidebar = this.sidebar;

    // Nav
    this.nav = new NavView({
      app: this,
      sidebar: this.sidebar,
      user: this.user,
    });
    this.subviews.nav = this.nav;

    key('j, k, enter, o', (e, handler) => {
      if (this.$el.find('.listing')[0]) {
        if (handler.key === 'j' || handler.key === 'k') {
          util.pageListing(handler.key);
        } else {
          util.goToFile();
        }
      }
    });

    key('ctrl+enter', (e, handler) => {
      if (this.nav.state === 'blob') {
        this.nav.trigger('edit');
      } else if (this.nav.state === 'edit') {
        this.nav.trigger('blob');
      }
    });
  }

  logout() {
    cookie.unset('oauth-token');
    cookie.unset('id');
    window.location.reload();
    return false;
  }

  remove(...args) {
    invoke(this.subviews, 'remove');
    this.subviews = {};

    super.remove(...args);
    // Backbone.View.prototype.remove.apply(this, arguments);
  }

  render() {
    this.$el.html(template(this.template)());

    this.loader.setElement(this.$el.find('#loader')).render();
    this.sidebar.setElement(this.$el.find('#drawer')).render();
    this.nav.setElement(this.$el.find('nav')).render();

    return this;
  }
}
