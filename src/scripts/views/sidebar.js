import Backbone from 'backbone';
import { invoke, clone, template } from 'lodash-es';

import templates from '../templates';

import SidebarBranchesView from './sidebar/branches';
import SidebarHistoryView from './sidebar/history';
import SidebarDraftsView from './sidebar/drafts';
import SidebarOrgsView from './sidebar/orgs';
import SidebarSaveView from './sidebar/save';
import SidebarSettingsView from './sidebar/settings';

const views = {
  branches: SidebarBranchesView,
  history: SidebarHistoryView,
  drafts: SidebarDraftsView,
  orgs: SidebarOrgsView,
  save: SidebarSaveView,
  settings: SidebarSettingsView,
};

export default class SidebarView extends Backbone.View {
  template = templates.drawer;

  subviews = {};

  initSubview(subview, options) {
    if (!views[subview]) return false;

    options = clone(options) || {};

    const view = new views[subview](options);
    this.$el.find(`#${subview}`).html(view.el);

    this.subviews[subview] = view;

    return view;
  }

  filepathGet() {
    return this.$el.find('.filepath').val();
  }

  updateState(label) {
    this.$el.find('.button.save').html(label);
  }

  open() {
    this.$el.toggleClass('open', true);
  }

  close() {
    this.$el.toggleClass('open', false);
  }

  toggle() {
    this.$el.toggleClass('open');
  }

  toggleMobile() {
    this.$el.toggleClass('mobile');
  }

  mode(mode) {
    // Set data-mode attribute to toggle nav buttons in CSS
    this.$el.attr('data-sidebar', mode);
  }

  remove(...args) {
    invoke(this.subviews, 'remove');
    this.subviews = {};

    super.remove(...args);
  }

  render() {
    this.$el.html(template(this.template)());
    invoke(this.subviews, 'render');
    return this;
  }
}
