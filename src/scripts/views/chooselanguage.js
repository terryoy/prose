import Backbone from 'backbone';
import { template } from 'lodash-es';

import { cookie } from '../storage/cookie';
import templates from '../templates';

import LOCALES from '../translations/locales';

export default class ChooseLanguageView extends Backbone.View {
  className = 'inner deep prose limiter';

  template = templates.chooselanguage;

  // events = {
  //   'click .language': 'setLanguage',
  // }

  constructor(options) {
    super({
      events: {
        'click .language': 'setLanguage',
      },
      ...options
    });
  }

  setLanguage(e) {
    if (!$(e.target).hasClass('active')) {
      const code = $(e.target).data('code');
      cookie.set('lang', code);

      // Check if the browsers language is supported
      window.locale.current(code);

      // Reflect changes. Could be more elegant.
      window.location.reload();
    }

    return false;
  }

  render() {
    const chooseLanguages = {
      languages: LOCALES,
      active: window.locale._current,
    };

    this.$el.empty().append(template(this.template, {
      variable: 'chooseLanguage',
    })(chooseLanguages));
    return this;
  }
}
