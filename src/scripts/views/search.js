import Backbone from 'backbone';
import { template } from 'lodash-es';
import { t } from '../translations';

import templates from '../templates';
import util from '../util';

export default class SearchView extends Backbone.View {
  template = templates.search;

  events = {
    'keyup input': 'keyup',
  }

  constructor(options) {
    super(options);
    this.delegateEvents();
    
    this.mode = options.mode;
    this.model = options.model;
  }

  keyup(e) {
    if (e && e.which === 27) {
      // ESC key
      this.input.val('');
      this.trigger('search');
    } else if (e && e.which === 40) {
      // Down Arrow
      util.pageListing('down');
      e.preventDefault();
      e.stopPropagation();
      this.input.blur();
    } else {
      this.trigger('search');
    }
  }

  search() {
    const searchstr = this.input ? this.input.val().toLowerCase() : '';
    const getText = (model) => {
      return this.mode === 'repos' ?
      `${model.get('owner').login}/${model.get('name')}` : model.get('name')
    }

    return this.model.filter(
      (model) => 
        getText(model).toLowerCase().indexOf(searchstr) > -1
    );
  }

  render() {
    let placeholder = t('main.repos.filter');
    if (this.mode === 'repo') placeholder = t('main.repo.filter');

    const search = {
      placeholder,
    };

    this.$el.empty().append(template(this.template, {
      variable: 'search',
    })(search));

    this.input = this.$el.find('input');
    this.input.focus();
    return this;
  }
}
