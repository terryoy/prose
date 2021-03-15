import Backbone from 'backbone';
import { template, delay } from 'lodash-es';
import { t } from '../translations';

import { Config } from '../config';
// import utils from '../util';
import templates from '../templates';
import { cookie } from '../storage/cookie';

// Set scope
Config.scope = cookie.get('scope') || 'repo';

export default class NavView extends Backbone.View {
  template = templates.nav;

  // events = {
  //   'click a.edit': 'emit',
  //   'click a.preview': 'emit',
  //   'click a.meta': 'emit',
  //   'click a.settings': 'emit',
  //   'click a.save': 'emit',
  //   'click .mobile .toggle': 'toggleMobile',
  // }

  constructor(options) {
    super({
      events: {
        'click a.edit': 'emit',
        'click a.preview': 'emit',
        'click a.meta': 'emit',
        'click a.settings': 'emit',
        'click a.save': 'emit',
        'click .mobile .toggle': 'toggleMobile',
      },
      ...options
    });
    this.app = options.app;
    this.sidebar = options.sidebar;
    this.user = options.user;
  }

  emit = (e) => {
    // TODO: get rid of this hack exception
    if (e && !$(e.currentTarget).hasClass('preview')) e.preventDefault();

    let state = $(e.currentTarget).data('state');
    if ($(e.currentTarget).hasClass('active')) {
      // return to file state
      state = this.state;
    }

    this.active(state);
    this.toggle(state, e);
  }

  setFileState(state) {
    this.state = state;
    this.active(state);
  }

  updateState(label, classes, kill) {
    if (!label) label = t('navigation.save');
    this.$save.html(label);

    // Add, remove classes to the file nav group
    this.$el.find('.file')
      .removeClass('error saving saved save')
      .addClass(classes);

    if (kill) {
      delay((() => {
        this.$el.find('.file').removeClass(classes);
      }), 1000);
    }
  }

  mode(mode) {
    this.$el.attr('class', mode);
  }

  active(state) {
    // Coerce 'new' to 'edit' to activate correct icon
    state = (state === 'new' ? 'edit' : state);
    this.$el.find('.file a').removeClass('active');
    this.$el.find(`.file a[data-state=${state}]`).toggleClass('active');
  }

  toggle(state, e) {
    this.trigger(state, e);
  }

  toggleMobile = (e) => {
    this.sidebar.toggleMobile();
    $(e.target).toggleClass('active');
    return false;
  }

  render() {
    this.$el.html(template(this.template, { variable: 'data' })({
      login: `${Config.site}/login/oauth/authorize`
          + `?client_id=${Config.id}&scope=${Config.scope}&redirect_uri=${
            encodeURIComponent(window.location.href)}`,
    }));

    this.$save = this.$el.find('.file .save .popup');
    return this;
  }
}
