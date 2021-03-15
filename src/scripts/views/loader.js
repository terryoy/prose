import Backbone from 'backbone';
import { defer, template } from 'lodash-es';

import templates from '../templates';

export default class LoaderView extends Backbone.View {
  template = templates.loading;

  queue = 0;

  start(message) {
    this.queue += 1;

    if (message) {
      this.$el.find('.message').html(message);
    }

    this.$el.show();
  }

  stop() {
    this.queue = 0;
    this.$el.fadeOut(150);
  }

  done = () => {
    defer(() => {
      this.queue -= 1;
      if (this.queue < 1) this.stop();
    });
  }

  render() {
    this.$el.html(template(this.template)());
    return this;
  }
}
