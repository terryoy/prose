import Backbone from "backbone";
import { isUndefined, isFunction } from "lodash-es";
import url from "url";

import { Config } from "../config";
import { cookie } from "../storage/cookie";

// import Backbone from 'backbone';
import Repos from "../collections/repos";
import Orgs from "../collections/orgs";

// TODO Pass Notification view here if something goes wrong?
// import NotificationView from '../views/notification';

// var auth = import { Config } from '../config';
// import { cookie } from '../storage/cookie';
// import templates from '../templates';

export const User = Backbone.Model.extend({
  initialize: function (attributes, options) {
    this.repos = new Repos([], { user: this });
    this.orgs = new Orgs([], { user: this });
  },

  authenticate: function (options) {
    let token = cookie.get("oauth-token");
    if (token) {
      console.log("local oauth-token detected:", token, " proceed to success");
      if (isFunction(options.success)) options.success();
    } else {
      var parsed = url.parse(window.location.href, true);
      var code = parsed.query && parsed.query.code;
      if (code) {
        let authApiUrl = Config.url + "/authenticate/" + code;
        console.log("try authenticate with code:", code, " url:", authApiUrl);
        var ajax = $.ajax(authApiUrl, {
          success: function (data) {
            console.log("receive token data:", data);
            if (data.token) {
              cookie.set("oauth-token", data.token);
              var newHref = url.format({
                protocol: parsed.protocol,
                slashes: parsed.slashes,
                host: parsed.host,
                pathname: parsed.pathname,
                hash: parsed.hash,
              });
              window.location.href = newHref;
              if (isFunction(options.success)) options.success();
            } else {
              // return to front page.
              if (isFunction(options.error)) options.error();
            }
          },
        });
      } else {
        if (isFunction(options.error)) options.error();
      }
    }
  },

  url: function () {
    var id = cookie.get("id");
    var token = cookie.get("oauth-token");

    // Return '/user' if authenticated but no user id cookie has been set yet
    // or if this model's id matches authenticated user id
    return (
      Config.api +
      ((token && isUndefined(id)) || (id && this.get("id") === id)
        ? "/user"
        : "/users/" + this.get("login"))
    );
  },
});

export default User;
