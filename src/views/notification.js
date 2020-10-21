
import Backbone from 'backbone';
import {
  clone, template
} from 'lodash-es';

// import Backbone from 'backbone';
import templates from '../templates';
// var templates = require('../../templates');
var util = require('../util');

module.exports = Backbone.View.extend({
  id: 'notification',

  className: 'notification round',

  template: templates.notification,

  events: {
    'click .create': 'createPost'
  },

  initialize: function(options) {
    options = clone(options) || {};

    this.message = options.message;
    this.error = options.error;
    this.options = options.options;
  },

  render: function() {
    util.documentTitle(t('docheader.error'));

    var data = {
      message: this.message,
      error: this.error,
      options: this.options
    }

    this.$el.html(template(this.template, {
      variable: 'data'
    })(data));

    return this;
  },

  createPost: function (e) {
    var hash = window.location.hash.split('/');
    hash[2] = 'new';

    var path = hash[hash.length - 1].split('?');
    hash[hash.length - 1] = path[0] + '?file=' + path[0];

    // append query string
    if (path.length > 1) {
      hash[hash.length - 1]  += '&' + path[1];
    }

    router.navigate(_(hash).compact().join('/'), { trigger: true });
    return false;
  }
});
