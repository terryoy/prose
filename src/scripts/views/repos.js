import Backbone from 'backbone';
import { invoke } from 'lodash-es';

import RepoView from './li/repo';

export default class ReposView extends Backbone.View {
  subviews = {}

  events = {
    'mouseover .item': 'activeListing',
    'mouseover .item a': 'activeListing',
  }

  constructor(options) {
    super(options);
    this.delegateEvents();
    
    this.model = options.model;
    this.search = options.search;
    this.listenTo(this.search, 'search', this.render);
  }

  activeListing = (e) => {
    let $listing = $(e.target);

    if (!$listing.hasClass('item')) {
      $listing = $(e.target).closest('li');
    }

    this.$listings.removeClass('active');
    $listing.addClass('active');

    // Blur out search if its selected
    this.$search.blur();
  }

  remove(...args) {
    invoke(this.subviews, 'remove');
    this.subviews = {};

    super.remove(...args);
  }

  render = () => {
    const collection = this.search ? this.search.search() : this.model;
    const frag = document.createDocumentFragment();

    collection.forEach(((repo, i) => {
      const view = new RepoView({
        index: i,
        model: repo,
      });

      frag.appendChild(view.render().el);
      this.subviews[repo.id] = view;
    }));

    this.$el.html(frag);

    this.$listings = this.$el.find('.item');
    this.$search = this.$el.find('#filter');

    return this;
  }
}
