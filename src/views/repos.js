import Backbone from 'backbone';
import { bindAll, invoke } from 'lodash-es';

var RepoView = require('./li/repo');

module.exports = Backbone.View.extend({
  subviews: {},

  events: {
    'mouseover .item': 'activeListing',
    'mouseover .item a': 'activeListing'
  },

  initialize: function(options) {
    bindAll(this, ['render']);
    this.model = options.model;
    this.search = options.search;

    this.listenTo(this.search, 'search', this.render);
  },

  render: function() {
    var collection = this.search ? this.search.search() : this.model;
    var frag = document.createDocumentFragment();

    collection.forEach((function(repo, i) {
      var view = new RepoView({
        index: i,
        model: repo
      });

      frag.appendChild(view.render().el);
      this.subviews[repo.id] = view;
    }).bind(this));

    this.$el.html(frag);

    this.$listings = this.$el.find('.item');
    this.$search = this.$el.find('#filter');

    return this;
  },

  activeListing: function(e) {
    var $listing = $(e.target);

    if (!$listing.hasClass('item')) {
      $listing = $(e.target).closest('li');
    }

    this.$listings.removeClass('active');
    $listing.addClass('active');

    // Blur out search if its selected
    this.$search.blur();
  },

  remove: function() {
    invoke(this.subviews, 'remove');
    this.subviews = {};

    Backbone.View.prototype.remove.apply(this, arguments);
  }
});
