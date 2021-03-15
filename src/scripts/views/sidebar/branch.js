import Backbone from 'backbone';
import { escape } from 'lodash-es';

export default class BranchView extends Backbone.View {
  constructor(options) {
    super({
      tagName: 'option',
      ...options,
    });
    this.model = options.model;
    this.repo = options.repo;
    this.branch = options.branch;
  }

  render = () => {
    this.$el.val(`#${[this.repo.get('owner').login, this.repo.get('name'), 'tree', this.model.get('name')].join('/')}`);
    this.el.selected = this.branch && this.branch === this.model.get('name');

    this.$el.html(escape(this.model.get('name')));

    return this;
  }
}
