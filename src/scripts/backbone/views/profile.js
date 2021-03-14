import Backbone from 'backbone';
import { template, invoke } from 'lodash-es';

import HeaderView from './header';
// import OrgsView from './sidebar/orgs';
// import utils from '../util';
import templates from '../templates';

export default class ProfileView extends Backbone.View {
  template = templates.profile;

  subviews = {};

  initialize(options) {
    this.auth = options.auth;
    this.repos = options.repos;
    this.router = options.router;
    this.search = options.search;
    this.sidebar = options.sidebar;
    this.user = options.user;
  }

  remove(...args) {
    this.sidebar.close();

    invoke(this.subviews, 'remove');
    this.subviews = {};

    super.remove(...args);
  }

  render() {
    this.$el.empty().append(template(this.template)());

    this.search.setElement(this.$el.find('#search')).render();
    this.repos.setElement(this.$el.find('#repos'));

    const header = new HeaderView({ user: this.user, alterable: false });
    header.setElement(this.$el.find('#heading')).render();
    this.subviews.header = header;

    if (this.auth) {
      const orgs = this.sidebar.initSubview('orgs', {
        model: this.auth.orgs,
        router: this.router,
        sidebar: this.sidebar,
        user: this.user,
      });

      this.subviews.orgs = orgs;
    }

    return this;
  }
}
