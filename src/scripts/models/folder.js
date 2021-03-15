
// import Backbone from 'backbone';
import Backbone from 'backbone';
import util from '.././util';

module.exports = Backbone.Model.extend({
  idAttribute: 'path',

  initialize: function(attributes, options) {
    this.branch = attributes.branch;
    this.collection = attributes.collection;
    this.repo = attributes.repo;

    this.set({
      'name': util.extractFilename(attributes.path)[1],
      'path': attributes.path,
      'type': attributes.type
    });
  },

  url: function() {
    return this.repo.url() + '/contents/' + this.get('path') + '?ref=' + this.branch.get('name');
  }
});
