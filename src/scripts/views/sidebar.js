import Backbone from 'backbone';
import { invoke, clone, template } from 'lodash-es';

// var util = require('../util');

var views = {
  branches: require('./sidebar/branches'),
  history: require('./sidebar/history'),
  drafts: require('./sidebar/drafts'),
  orgs: require('./sidebar/orgs'),
  save: require('./sidebar/save'),
  settings: require('./sidebar/settings')
};

import templates from '../templates';

module.exports = Backbone.View.extend({
  template: templates.drawer,

  subviews: {},

  render: function() {
    this.$el.html(template(this.template)());
    invoke(this.subviews, 'render');
    return this;
  },

  initSubview: function(subview, options) {
    if (!views[subview]) return false;

    options = clone(options) || {};

    var view = new views[subview](options);
    this.$el.find('#' + subview).html(view.el);

    this.subviews[subview] = view;

    return view;
  },

  filepathGet: function() {
    return this.$el.find('.filepath').val();
  },

  updateState: function(label) {
    this.$el.find('.button.save').html(label);
  },

  open: function() {
    this.$el.toggleClass('open', true);
  },

  close: function() {
    this.$el.toggleClass('open', false);
  },

  toggle: function() {
    this.$el.toggleClass('open');
  },

  toggleMobile: function() {
    this.$el.toggleClass('mobile');
  },

  mode: function(mode) {
    // Set data-mode attribute to toggle nav buttons in CSS
    this.$el.attr('data-sidebar', mode);
  },

  remove: function() {
    invoke(this.subviews, 'remove');
    this.subviews = {};

    Backbone.View.prototype.remove.apply(this, arguments);
  }
});
