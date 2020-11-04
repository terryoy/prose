/**
 * Check User Login:
 *   - If user not logged in, init <router> without user,
 *   - If it is redirected from Github SSO, get the code redirected from github, and send to gatekeeper for verification.
 *   - after user is authorized, init <router> with user,
 */
import Backbone from 'backbone';
import { User } from './models/user';
import { cookie } from './storage/cookie';
import Router from './router';
import { t } from  './translations';

const authenticate = (config) => {

  var user = new User();

  user.authenticate({
    success: function() {
      if ('withCredentials' in new XMLHttpRequest()) {
        // Set OAuth header for all CORS requests
        $.ajaxSetup({
          headers: {
            'Authorization': config.auth === 'oauth' ?
              'token ' + cookie.get('oauth-token') :
              'Basic ' + Base64.encode(config.username + ':' + config.password)
          }
        });

        // Set an 'authenticated' class to #prose
        $('#prose').addClass('authenticated');

        // Set User model id and login from cookies
        var id = cookie.get('id');
        if (id) user.set('id', id);

        var login = cookie.get('login');
        if (login) user.set('login', login);

        user.fetch({
          success: function(model, res, options) {
            // Set authenticated user id and login cookies
            cookie.set('id', user.get('id'));
            cookie.set('login', user.get('login'));

            // Initialize router
            window.router = new Router({ user: model });

            // Start responding to routes
            Backbone.history.start();
          },
          error: function(model, res, options) {
            var apiStatus = status.githubApi(function(res) {

              var error = new NotificationView({
                'message': t('notification.error.github'),
                'options': [
                  {
                    'title': t('notification.back'),
                    'link': '/'
                  },
                  {
                    'title': t('notification.githubStatus', {
                      status: res.status
                    }),
                    'link': '//status.github.com',
                    'className': res.status
                  }
                ]
              });

              $('#prose').html(error.render().el);
            });
          }
        });
      } else {
        var upgrade = new NotificationView({
          'message': t('main.upgrade.content'),
          'options': [{
            'title': t('main.upgrade.download'),
            'link': 'https://www.google.com/intl/en/chrome/browser'
          }]
        });

        $('#prose').html(upgrade.render().el);
      }
    },
    error: function() {
      // Initialize router
      window.router = new Router();

      // Start responding to routes
      Backbone.history.start();
    }
  });
};

/**
 * Main entry to the application.
 */
export const init = (config) => {
  // start authentication
  authenticate(config);

  // Set locale as global variable
  // window.locale.en = en;
  window.locale.current('en');
  window.app = {};
  window.Backbone = Backbone;
};
