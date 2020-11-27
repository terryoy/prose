
import Backbone from 'backbone';
import { template } from 'lodash-es';


import { cookie } from '../storage/cookie';
import templates from '../templates';
var LOCALES = require('../translations/locales');

module.exports = Backbone.View.extend({
  className: 'inner deep prose limiter',

  template: templates.chooselanguage,

  events: {
    'click .language': 'setLanguage'
  },

  render: function() {
    var chooseLanguages = {
      languages: LOCALES,
      active: window.locale._current
    };

    this.$el.empty().append(template(this.template, {
      variable: 'chooseLanguage'
    })(chooseLanguages));
    return this;
  },

  setLanguage: function(e) {
    if (!$(e.target).hasClass('active')) {
      var code = $(e.target).data('code');
      cookie.set('lang', code);

      // Check if the browsers language is supported
      window.locale.current(code);

      // Reflect changes. Could be more elegant.
      window.location.reload();
    }

    return false;
  }
});
