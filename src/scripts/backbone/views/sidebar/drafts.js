import Backbone from 'backbone';
import { template } from 'lodash-es';

import templates from '../../templates';

export default class DraftsView extends Backbone.View {
    className = 'inner';

    template = templates.sidebar.drafts;

    constructor(options) {
      super(options);
      this.link = options.link;
      this.sidebar = options.sidebar;
    }

    render() {
      this.$el.html(template(this.template, {
        variable: 'link',
      })(this.link));

      this.sidebar.open();

      return this;
    }
}
