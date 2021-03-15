import Backbone from 'backbone';
import { extend, template } from 'lodash-es';

import { cookie } from '../../storage/cookie';
import templates from '../../templates';

export default class RepoView extends Backbone.View {
  template = templates.li.repo;

  constructor(options) {
    super({
      tagName: 'li',
      className: 'item clearfix',
      ...options,
    });

    this.model = options.model;
    this.$el.attr('data-index', options.index);
    this.$el.attr('data-id', this.model.id);
    this.$el.attr('data-navigate', `#${this.model.get('owner').login}/${this.model.get('name')}`);
  }

  render = () => {
    const data = extend(this.model.attributes, {
      login: cookie.get('login'),
    });

    this.$el.empty().append(template(this.template, {
      variable: 'repo',
    })(data));

    return this;
  }
}
