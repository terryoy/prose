import Backbone from 'backbone';
import { template } from 'lodash-es';

import templates from '../../templates';
import { cookie } from '../../storage/cookie';

export default class OrgsView extends Backbone.View {
    template = templates.sidebar.orgs;

    constructor(options) {
      super(options);
      this.model = options.model;
      this.router = options.router;
      this.sidebar = options.sidebar;
      this.user = options.user;

      this.model.fetch({
        success: this.render,
        error: (model, xhr, options) => {
          this.router.error(xhr);
        },
      });
    }

    render = () => {
      const orgs = {
        login: {
          user: cookie.get('login'),
          id: cookie.get('id'),
        },
        user: this.user.toJSON(),
        orgs: this.model.toJSON(),
      };

      this.$el.html(template(this.template, {
        variable: 'data',
      })(orgs));

      // Update active user or organization
      this.$el.find('li a').removeClass('active');
      this.$el.find(`li a[data-id="${this.user.get('id')}"]`).addClass('active');
      this.sidebar.open();

      return this;
    }
}
