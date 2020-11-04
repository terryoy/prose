

import Backbone from 'backbone';
import { clone, extend } from 'lodash-es';

var Repo = require('../models/repo');

import { Config } from '../config';
import { cookie } from '../storage/cookie';

var util = require('../util');

module.exports = Backbone.Collection.extend({
  model: Repo,

  initialize: function(models, options) {
    this.user = options.user;

    this.comparator = function(repo) {
      return -(new Date(repo.get('updated_at')).getTime());
    };
  },

  fetch: function(options) {
    options = clone(options) || {};

    var cb = options.success;

    var success = (function(res, statusText, xhr) {
      this.add(res);
      util.parseLinkHeader(xhr, {
        success: success,
        complete: cb
      });
    }).bind(this);

    Backbone.Collection.prototype.fetch.call(this, extend(options, {
      success: (function(model, res, options) {
        util.parseLinkHeader(options.xhr, {
          success: success,
          error: cb
        });
      }).bind(this)
    }));
  },

  url: function() {
    var id = cookie.get('id');
    var type = this.user.get('type');
    var path;

    switch(type) {
    case 'User':
      path = (id && this.user.get('id') === id) ? '/user' :
        ('/users/' + this.user.get('login'));
      break;
    case 'Organization':
      path = '/orgs/' + this.user.get('login');
      break;
    }

    return Config.api + path + '/repos?per_page=100';
  }
});
