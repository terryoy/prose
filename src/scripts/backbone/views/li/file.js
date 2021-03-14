import Backbone from 'backbone';
import { extend, template } from 'lodash-es';

import CommitView from '../sidebar/li/commit';
import templates from '../../templates';
// import util from '../../util';

export default class FileView extends Backbone.View {
  template = templates.li.file;

  events = {
    'click a.delete': 'destroy',
  }

  constructor(options) {
    super({
      tagName: 'li',
      className: 'item clearfix',
      ...options,
    });
    this.branch = options.branch;
    this.history = options.history;
    this.model = options.model;
    this.repo = options.repo;
    this.router = options.router;

    this.$el.attr('data-index', options.index);

    if (!this.model.get('binary')) {
      this.$el.attr('data-navigate', `#${this.repo.get('owner').login}/${
        this.repo.get('name')}/edit/${this.branch}/${
        this.model.get('path')}`);
    }
  }

  destroy = (e) => {
    if (confirm(t('actions.delete.warn'))) {
      this.model.destroy({
        success: (function (model, res, options) {
          const { commit } = res;

          const view = new CommitView({
            branch: this.branch,
            file: extend(commit, {
              contents_url: model.get('content_url'),
              filename: model.get('path'),
              status: 'removed',
            }),
            repo: this.repo,
            view: this.view,
          });

          this.history.$el.find('#commits').prepend(view.render().el);
          this.history.subviews[commit.sha] = view;

          this.$el.fadeOut('fast');
        }).bind(this),
        error: (function (model, xhr, options) {
          this.router.error(xhr);
        }).bind(this),
      });
    }

    return false;
  }

  render() {
    const data = extend(this.model.attributes, {
      branch: this.branch,
      repo: this.repo.attributes,
    });

    const rooturl = this.model.collection.config
      && this.model.collection.config.rooturl;
    const regex = new RegExp(`^${rooturl}(.*)`);
    const jailpath = rooturl ? data.path.match(regex) : false;

    data.jailpath = jailpath ? jailpath[1] : data.path;

    this.$el.html(template(this.template, {
      variable: 'file',
    })(data));

    return this;
  }
}
