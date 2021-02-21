
// import Backbone from 'backbone';
import Backbone from 'backbone';
import { clone, max, isFunction } from 'lodash-es';

var Branches = require('../collections/branches');
var Commits = require('../collections/commits');
import { Config } from '../config';

module.exports = Backbone.Model.extend({
  constructor: function(attributes, options) {
    Backbone.Model.call(this, {
      id: attributes.id,
      description: attributes.description,
      fork: attributes.fork,
      homepage: attributes.homepage,
      default_branch: attributes.default_branch,
      name: attributes.name,
      owner: {
        id: attributes.owner.id,
        login: attributes.owner.login
      },
      permissions: attributes.permissions,
      private: attributes.private,
      updated_at: attributes.updated_at
    });
  },

  initialize: function(attributes, options) {
    this.branches = new Branches([], { repo: this });
    this.commits = new Commits([], { repo: this, branch: this.branch });
  },

  ref: function(options) {
    options = clone(options) || {};

    $.ajax({
      type: 'POST',
      url: this.url() + '/git/refs',
      data: JSON.stringify({
        ref: options.ref,
        sha: options.sha
      }),
      success: options.success,
      error: options.error
    });
  },

  fork: function(options) {
    options = clone(options) || {};

    var success = options.success;

    $.ajax({
      type: 'POST',
      url: this.url() + '/forks',
      success: (function(res) {
        // Initialize new Repo model
        // TODO: is referencing module.exports in this manner acceptable?
        var repo = new module.exports(res);

        // TODO: Forking is async, retry if request fails
        repo.branches.fetch({
          success: (function(collection, res, options) {
            collection = repo.branches;
            var prefix = 'prose-patch-';

            var branches = collection.filter(function(model) {
              return model.get('name').indexOf(prefix) === 0;
            }).map(function(model) {
              return parseInt(model.get('name').split(prefix)[1]);
            });

            var branch = prefix + (branches.length ? max(branches) + 1 : 1);

            if (isFunction(success)) success(repo, branch);
          }).bind(this),
          error: options.error
        });
      }).bind(this),
      error: options.error
    });
  },

  url: function() {
    var url = Config.api + '/repos/' + this.get('owner').login + '/' + this.get('name');
    return url;
  }
});
