import Backbone from 'backbone';
import { extend, template } from 'lodash-es';

import templates from '../../templates';

export default class FolderView extends Backbone.View {
    template = templates.li.folder;

    constructor(options) {
      super({
        tagName: 'li',
        className: 'item clearfix',
        ...options,
      });
      this.model = options.model;
      this.repo = options.repo;
      this.branch = options.branch;

      this.$el.attr('data-index', options.index);
      this.$el.attr('data-navigate', `#${this.repo.get('owner').login}/${
        this.repo.get('name')}/tree/${this.branch}/${
        this.model.get('path')}`);
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

      this.$el.empty().append(template(this.template, {
        variable: 'folder',
      })(data));

      return this;
    }
}
