import Backbone from 'backbone';
import { template } from 'lodash-es';

import templates from '../templates';

export default class Modal extends Backbone.View {
  className = 'modal overlay';

  template = templates.modal;

  events = {
    'click .got-it': 'confirm',
  }

  constructor(options) {
    super({
      events: {
        'click .got-it': 'confirm',
      },
      ...options
    });
    this.message = this.options.message;
  }

  confirm = () => {
    const view = this;
    this.$el.fadeOut('fast', () => {
      view.remove();
    });
    return false;
  }

  render = () => {
    const modal = {
      message: this.message,
    };
    this.$el.empty().append(template(templates.modal, {
      variable: 'modal',
    })(modal));

    return this;
  }
}
