import Backbone from 'backbone';
import {
  clone, template, compact,
} from 'lodash-es';

// import Backbone from 'backbone';
import Router from '../router';
import templates from '../templates';
import { t } from '../translations';
import util from '../util';

// import templates from '../../templates';
// import util from '../util';

export default class NotificationView extends Backbone.View {
  id = 'notification';

  className = 'notification round';

  template = templates.notification;

  events = {
    'click .create': 'createPost',
  }

  constructor(options) {
    super(options);
    this.delegateEvents();
    options = clone(options) || {};

    this.message = options.message;
    this.error = options.error;
    this.options = options.options;
  }

  createPost(e) {
    const hash = window.location.hash.split('/');
    hash[2] = 'new';

    const path = hash[hash.length - 1].split('?');
    hash[hash.length - 1] = `${path[0]}?file=${path[0]}`;

    // append query string
    if (path.length > 1) {
      hash[hash.length - 1] += `&${path[1]}`;
    }

    Router.navigate(compact(hash).join('/'), { trigger: true });
    return false;
  }

  render() {
    util.documentTitle(t('docheader.error'));

    const data = {
      message: this.message,
      error: this.error,
      options: this.options,
    };

    this.$el.html(template(this.template, {
      variable: 'data',
    })(data));

    return this;
  }
}
