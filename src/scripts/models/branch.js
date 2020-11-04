import Backbone from 'backbone';
var Files = require('../collections/files');
import { Config } from '../config';

module.exports = Backbone.Model.extend({
  initialize: function(attributes, options) {
    this.repo = attributes.repo;

    this.set('name', attributes.name);

    var sha = attributes.commit.sha;
    this.set('sha', sha);

    this.files = new Files([], {
      repo: this.repo,
      branch: this,
      sha: sha
    });
  },

  url: function() {
    return this.repo.url() + '/branches/' + this.get('name');
  }
});
