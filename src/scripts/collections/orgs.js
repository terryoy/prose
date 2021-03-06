
import Backbone from 'backbone';
import { clone } from 'lodash-es';

import Org from '../models/org';
import { Config } from '../config';
import { cookie } from '../storage/cookie';

module.exports = Backbone.Collection.extend({
  model: Org,

  initialize: function(models, options) {
    options = clone(options) || {};
    this.user = options.user;
  },

  url: function() {
    var token = cookie.get('oauth-token');
    var scope = cookie.get('scope');

    // If not authenticated, show public repos for user in path.
    // https://developer.github.com/v3/orgs/#list-user-organizations
    if (!token || scope !== 'repo') {
      return Config.api + '/users/' + this.user.get('login') + '/orgs';
    }

    // Authenticated users see all repos they have access to.
    // https://developer.github.com/v3/orgs/#list-your-organizations
    else {
      return Config.api + '/user/orgs';
    }
  }
});
