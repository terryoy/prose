
import Backbone from 'backbone';
import { isUndefined, isFunction } from 'lodash-es';
import url from 'url';

import { Config } from '../config';
import { cookie } from '../storage/cookie';

// import Backbone from 'backbone';
var Repos = require('../collections/repos');
var Orgs = require('../collections/orgs');

// TODO Pass Notification view here if something goes wrong?
var NotificationView = require('../views/notification');

// var auth = import { Config } from '../config';
// import { cookie } from '../storage/cookie';
import templates from '../templates';

module.exports = Backbone.Model.extend({
  initialize: function(attributes, options) {
    this.repos = new Repos([], { user: this });
    this.orgs = new Orgs([], { user: this });
  },

  authenticate: function(options) {
    if (cookie.get('oauth-token')) {
      if (isFunction(options.success)) options.success();
    } else {
      var parsed = url.parse(window.location.href, true);
      var code = parsed.query && parsed.query.code;
      if (code) {
        var ajax = $.ajax(Config.url + '/authenticate/' + code, {
          success: function(data) {
            cookie.set('oauth-token', data.token);
            var newHref = url.format({
              protocol: parsed.protocol,
              slashes: parsed.slashes,
              host: parsed.host,
              pathname: parsed.pathname,
              hash: parsed.hash
            });
            window.location.href = newHref;
            if (isFunction(options.success)) options.success();
          }
        });
      } else {
        if (isFunction(options.error)) options.error();
      }
    }
  },

  url: function() {
    var id = cookie.get('id');
    var token = cookie.get('oauth-token');

    // Return '/user' if authenticated but no user id cookie has been set yet
    // or if this model's id matches authenticated user id
    return Config.api + ((token && isUndefined(id)) || (id && this.get('id') === id) ?
      '/user' : '/users/' + this.get('login'));
  }
});
