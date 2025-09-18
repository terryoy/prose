
import Backbone from 'backbone';

const CommitModel = Backbone.Model.extend({
  initialize: function(attributes, options) {
    this.repo = attributes.repo;
  },

  url: function() {
    return this.repo.url() + '/commits/' + this.get('sha');
  }
});

export default CommitModel;
