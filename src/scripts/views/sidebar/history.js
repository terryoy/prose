import Backbone from 'backbone';
import {
  bindAll, flatten, groupBy, uniq, map, union, template, invoke,
} from 'lodash-es';
import { queue } from 'd3-queue';

import CommitView from './li/commit';

// var queue = require('queue-async');

import { cookie } from '../../storage/cookie';
import templates from '../../templates';
// import utils from '../../util';

export default class HistoryView extends Backbone.View {
    subviews = {};

    template = templates.sidebar.label;

    constructor(options) {
      super(options);

      const { app } = options;
      app.loader.start();

      this.app = app;
      this.branch = options.branch;
      this.commits = options.commits;
      this.repo = options.repo;
      this.router = options.router;
      this.sidebar = options.sidebar;
      this.user = options.user;
      this.view = options.view;

      bindAll(this, ['render']);

      this.commits.setBranch(this.branch, {
        success: this.render,
        error: (function (model, xhr, options) {
          this.router.error(xhr);
        }).bind(this),
        complete: this.app.loader.done,
      });
    }

    renderFiles(commits, label) {
      this.app.loader.start();

      // Shallow flatten mapped array of all commit files
      const files = flatten(map(commits, (commit) => commit.get('files')), true);

      /*
    // TODO: jail files to rooturl #541
    // This is difficult, as rooturl is set in Files collection
    // on a successful fetch

    if (rooturl) {
      files = files.filter(function(file) {
        return file.filename.indexOf(rooturl) === 0;
      });
    }
    */

      const fileCommitsMap = groupBy(files, (file) => file.filename);

      const list = uniq(map(files, (file) => file.filename));

      if (list.length) {
        // Iterate over files and build fragment to append
        const frag = document.createDocumentFragment();
        const ul = frag.appendChild(document.createElement('ul'));
        ul.className = 'listing';

        list.slice(0, 5).forEach((file, index) => {
          const commits = fileCommitsMap[file];
          const commit = commits[0];

          const view = new CommitView({
            branch: this.branch,
            file: commit,
            repo: this.repo,
            view: this.view,
          });

          ul.appendChild(view.render().el);
          this.subviews[commit.sha] = view;
        });

        const tmpl = template(this.template, { variable: 'label' });
        this.$el.append(tmpl(label), frag);
      }
      this.app.loader.done();
    }

    remove = (...args) => {
      invoke(this.subviews, 'remove');
      this.subviews = {};

      Backbone.View.prototype.remove.apply(this, args);
    }

    render = (options) => {
      this.app.loader.start();

      this.$el.empty();

      // Filter on commit.get('author').id === this.user.get('id')
      const id = cookie.get('id') || false;

      // Group and deduplicate commits by authenticated user
      const history = this.commits.groupBy((commit) => {
        // Handle malformed commit data
        const author = commit.get('author') || commit.get('commit').author;
        return author && author.id === id ? 'author' : 'all';
      });

      // TODO: how many commits should be fetched initially?
      // TODO: option to load more?

      // List of recent updates by all other users
      this.history = (history.all || []).slice(0, 15);

      // Recent commits by authenticated user
      this.recent = (history.author || []).slice(0, 15);

      const q = queue();

      union(this.history, this.recent).forEach((commit) => {
        q.defer(function (cb) {
          commit.fetch({
            success(model, res, options) {
              // This is necessary instead of success: cb for some reason
              cb();
            },
            error: (function (model, xhr, options) {
              this.router.error(xhr);
            }).bind(this),
          });
        });
      });

      q.awaitAll(((err, res) => {
        if (err) return err;

        this.renderFiles(this.history, 'History');
        this.renderFiles(this.recent, t('sidebar.repo.history.label'));

        this.sidebar.open();

        this.app.loader.done();
      }));

      return this;
    }
}
