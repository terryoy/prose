
var marked = require('marked');
import Backbone from 'backbone';

module.exports = Backbone.View.extend({
  className: 'inner deep prose limiter',

  render: function() {
    this.$el.empty()
      .append(marked(t('about.content')));
    return this;
  }
});
