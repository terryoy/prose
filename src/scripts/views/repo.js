// var queue = require('queue-async');
import Backbone from 'backbone';
import {
  bindAll, isFunction, template, invoke,
} from 'lodash-es';
import { queue } from 'd3-queue';
// import util from '.././util';
import templates from '../templates';

import FilesView from './files';
import HeaderView from './header';
import SearchView from './search';

export default class RepoView extends Backbone.View {
  template = templates.repo;

  events = {
    'click a.new': 'create',
  };

  subviews = {};

  constructor(options) {
    super(options);
    this.delegateEvents();

    const { app } = options;
    app.loader.start();

    // Init subviews
    this.initBranches();
    this.initHeader();

    const q = queue();
    q.defer(this.initSearch);
    q.defer(this.initHistory);
    q.awaitAll(this.initFiles);

    app.loader.done();
  }

  initialize(options) {
    this.app = options.app;
    this.branch = options.branch || this.model.get('default_branch');
    this.model = options.model;
    this.nav = options.nav;
    this.path = options.path || '';
    this.router = options.router;
    this.sidebar = options.sidebar;

    // bindAll(this, ['initSearch', 'initHistory', 'initFiles']);

    // Events from sidebar
    this.listenTo(this.sidebar, 'destroy', this.destroy);
    this.listenTo(this.sidebar, 'cancel', this.cancel);
    this.listenTo(this.sidebar, 'confirm', this.updateFile);
  }

  initHeader() {
    this.header = new HeaderView({
      repo: this.model,
      alterable: false,
    });

    this.subviews.header = this.header;
  }

  initSearch = (cb) => {
    this.search = new SearchView({
      mode: 'repo',
    });

    this.subviews.search = this.search;

    if (isFunction(cb)) cb.apply(this);
  }

  initFiles = () => {
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
      sidebar: this.sidebar,
    });

    this.subviews.files = this.files;
  }

  initBranches = () => {
    this.branches = this.sidebar.initSubview('branches', {
      app: this.app,
      model: this.model.branches,
      repo: this.model,
      branch: this.branch,
      router: this.router,
      sidebar: this.sidebar,
    });

    this.subviews.branches = this.branches;
  }

  initHistory = (cb) => {
    this.history = this.sidebar.initSubview('history', {
      app: this.app,
      branch: this.branch,
      commits: this.model.commits,
      repo: this.model,
      router: this.router,
      sidebar: this.sidebar,
      view: this,
    });

    this.subviews.history = this.history;

    if (isFunction(cb)) cb.apply(this);
  }

  create() {
    this.files.newFile();
    return false;
  }

  remove(...args) {
    this.sidebar.close();

    invoke(this.subviews, 'remove');
    this.subviews = {};

    super.remove(...args);
  }

  render() {
    this.$el.html(template(this.template)());

    this.header.setElement(this.$el.find('#heading')).render();
    this.search.setElement(this.$el.find('#search')).render();
    this.files.setElement(this.$el.find('#files'));

    return this;
  }
}
