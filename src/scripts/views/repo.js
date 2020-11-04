

// var queue = require('queue-async');
import Backbone from 'backbone';
import { bindAll, isFunction, template, invoke } from 'lodash-es';
import { queue } from 'd3-queue';

var FilesView = require('./files');
var HeaderView = require('./header');
var SearchView = require('./search');
// var util = require('.././util');
import templates from '../templates';

module.exports = Backbone.View.extend({
  template: templates.repo,

  events: {
    'click a.new': 'create'
  },

  subviews: {},

  initialize: function(options) {
    var app = options.app;
    app.loader.start();

    this.app = app;
    this.branch = options.branch || this.model.get('default_branch');
    this.model = options.model;
    this.nav = options.nav;
    this.path = options.path || '';
    this.router = options.router;
    this.sidebar = options.sidebar;

    // Init subviews
    this.initBranches();
    this.initHeader();

    bindAll(this, ['initSearch', 'initHistory', 'initFiles']);

    var q = queue();
    q.defer(this.initSearch);
    q.defer(this.initHistory);
    q.awaitAll(this.initFiles);

    // Events from sidebar
    this.listenTo(this.sidebar, 'destroy', this.destroy);
    this.listenTo(this.sidebar, 'cancel', this.cancel);
    this.listenTo(this.sidebar, 'confirm', this.updateFile);

    app.loader.done();
  },

  render: function() {
    this.$el.html(template(this.template)());

    this.header.setElement(this.$el.find('#heading')).render();
    this.search.setElement(this.$el.find('#search')).render();
    this.files.setElement(this.$el.find('#files'));

    return this;
  },

  initHeader: function() {
    this.header = new HeaderView({
      repo: this.model,
      alterable: false
    });

    this.subviews['header'] = this.header;
  },

  initSearch: function(cb) {
    this.search = new SearchView({
      mode: 'repo'
    });

    this.subviews['search'] = this.search;

    if (isFunction(cb)) cb.apply(this);
  },

  initFiles: function() {
    this.files = new FilesView({
      app: this.app,
      branch: this.branch,
      branches: this.model.branches,
      history: this.history,
      nav: this.nav,
      path: this.path,
      repo: this.model,
      router: this.router,
      search: this.search,
      sidebar: this.sidebar
    });

    this.subviews['files'] = this.files;
  },

  initBranches: function() {
    this.branches = this.sidebar.initSubview('branches', {
      app: this.app,
      model: this.model.branches,
      repo: this.model,
      branch: this.branch,
      router: this.router,
      sidebar: this.sidebar
    });

    this.subviews['branches'] = this.branches;
  },

  initHistory: function(cb) {
    this.history = this.sidebar.initSubview('history', {
      app: this.app,
      branch: this.branch,
      commits: this.model.commits,
      repo: this.model,
      router: this.router,
      sidebar: this.sidebar,
      view: this
    });

    this.subviews['history'] = this.history;

    if (isFunction(cb)) cb.apply(this);
  },

  create: function() {
    this.files.newFile();
    return false;
  },

  remove: function() {
    this.sidebar.close();

    invoke(this.subviews, 'remove');
    this.subviews = {};

    Backbone.View.prototype.remove.apply(this, arguments);
  }
});