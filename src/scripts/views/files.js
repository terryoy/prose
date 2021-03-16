import Backbone from 'backbone';
import {
  bindAll, compact, template, invoke,
} from 'lodash-es';

import File from '../models/file';
import Folder from '../models/folder';
import FileView from './li/file';
import FolderView from './li/folder';
import templates from '../templates';
import util from '../util';

export default class FilesView extends Backbone.View {
  className = 'listings';

  template = templates.files;

  subviews = {};

  events = {
    'mouseover .item': 'activeListing',
    'mouseover .item a': 'activeListing',
    'click .breadcrumb a': 'navigate',
    'click .item a': 'navigate',
  }

  constructor(options) {
    super(options);
    this.delegateEvents();

    const { app } = options;
    app.loader.start();

    this.app = app;
    this.branch = options.branch || options.repo.get('default_branch');
    this.branches = options.branches;
    this.history = options.history;
    this.nav = options.nav;
    this.path = options.path || '';
    this.repo = options.repo;
    this.router = options.router;
    this.search = options.search;
    this.sidebar = options.sidebar;

    // bindAll(this, ['setModel']);

    this.branches.fetch({
      success: this.setModel,
      error: (function (model, xhr, options) {
        this.router.error(xhr);
      }).bind(this),
      complete: this.app.loader.done,
    });
  }

  setModel = () => {
    this.app.loader.start();

    this.model = this.branches.findWhere({ name: this.branch }).files;

    this.model.fetch({
      success: (function () {
        // Update this.path with rooturl
        const { config } = this.model;
        this.rooturl = config && config.rooturl ? config.rooturl : '';

        this.presentationModel = this.model.filteredModel || this.model;
        this.search.model = this.presentationModel;
        // Render on fetch and on search
        this.listenTo(this.search, 'search', this.render);
        this.render();
      }).bind(this),
      error: (function (model, xhr, options) {
        this.router.error(xhr);
      }).bind(this),
      complete: this.app.loader.done,
      reset: true,
    });
  }

  newFile() {
    const path = [
      this.repo.get('owner').login,
      this.repo.get('name'),
      'new',
      this.branch,
      this.path ? this.path : this.rooturl,
    ];

    this.router.navigate(compact(path).join('/'), true);
  }

  activeListing(e) {
    let $listing = $(e.target);

    if (!$listing.hasClass('item')) {
      $listing = $(e.target).closest('li');
    }

    this.$el.find('.item').removeClass('active');
    $listing.addClass('active');

    // Blur out search if its selected
    this.search.$el.blur();
  }

  navigate(e) {
    const target = e.currentTarget;
    const path = target.href.split('#')[1];
    const match = path.match(/tree\/([^/]*)\/?(.*)$/);

    if (e && match) {
      e.preventDefault();

      this.path = match ? match[2] : path;
      this.render();

      this.router.navigate(path);
    }
  }

  remove(...args) {
    invoke(this.subviews, 'remove');
    this.subviews = {};

    super.remove(...args);
  }

  render() {
    this.app.loader.start();

    const search = this.search && this.search.input && this.search.input.val();
    const rooturl = this.rooturl ? `${this.rooturl}/` : '';
    const path = this.path ? `${this.path}/` : '';
    let drafts;

    const url = [
      this.repo.get('owner').login,
      this.repo.get('name'),
      'tree',
      this.branch,
    ].join('/');

    // Set rooturl jail from collection config
    const regex = new RegExp(`^${path || rooturl}[^/]*$`);

    // Render drafts link in sidebar as subview
    // if _posts directory exists and path does not begin with _drafts
    if (this.presentationModel.get('_posts') && /^(?!_drafts)/.test(this.path)) {
      drafts = this.sidebar.initSubview('drafts', {
        link: [url, '_drafts'].join('/'),
        sidebar: this.sidebar,
      });

      this.subviews.drafts = drafts;
      drafts.render();
    }

    const data = {
      path,
      parts: util.chunkedPath(this.path),
      rooturl,
      url,
    };

    this.$el.html(template(this.template, { variable: 'data' })(data));

    // if not searching, filter to only show current level
    const collection = search ? this.search.search() : this.presentationModel.filter((file) => regex.test(file.get('path')));

    const frag = document.createDocumentFragment();

    collection.forEach((file, index) => {
      let view;
      if (file instanceof File) {
        view = new FileView({
          branch: this.branch,
          history: this.history,
          index,
          model: file,
          repo: this.repo,
          router: this.router,
        });
      } else if (file instanceof Folder) {
        view = new FolderView({
          branch: this.branch,
          history: this.history,
          index,
          model: file,
          repo: this.repo,
          router: this.router,
        });
      }
      frag.appendChild(view.render().el);
      this.subviews[file.id] = view;
    });

    this.$el.find('ul').html(frag);

    this.app.loader.done();

    return this;
  }
}
