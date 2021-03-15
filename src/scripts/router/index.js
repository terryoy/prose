import Backbone from 'backbone';
import {
  find, clone, isUndefined,
} from 'lodash-es';
import { t } from '../translations';

import { User } from '../models/user';
// var File from '../models/file');

import AppView from '../views/app';
import NotificationView from '../views/notification';
import StartView from '../views/start';
import ProfileView from '../views/profile';
import SearchView from '../views/search';
import ReposView from '../views/repos';
import RepoView from '../views/repo';
import FileView from '../views/file';
import DocumentationView from '../views/documentation';
import ChooseLanguageView from '../views/chooselanguage';

import { Config } from '../config';
import { cookie } from '../storage/cookie';

import Users from '../collections/users';
// var Orgs from '../collections/orgs');

import Repo from '../models/repo';

// import templates from '../templates';
import util from '../util';

// Set scope
Config.scope = cookie.get('scope') || 'repo';

// Find the proper repo.
// Handles users with access to a repo *and* it's fork,
// depending on the login.
function findUserRepo(user, repoName) {
  const login = user.get('login');
  let repo;
  // If user has access to repos with the same name,
  // use the repo that matches the login/url, if available.
  // https://github.com/prose/prose/issues/939
  const repos = user.repos.filter((model) => model.get('name') === repoName);
  if (repos.length === 1) {
    repo = repos[0];
  } else if (repos.length > 1) {
    // Returns false if there isn't a repo with a matching login.
    // We're fine with that since isUndefined(false) === true
    repo = find(repos, (model) => model.get('owner').login === login);
  }
  return repo;
}

function newRepo(user, repoName) {
  return new Repo({
    name: repoName,
    owner: {
      login: user.get('login'),
    },
  });
}

module.exports = Backbone.Router.extend({

  routes: {
    'about(/)': 'about',
    'chooselanguage(/)': 'chooseLanguage',
    ':user(/)': 'profile',
    ':user/:repo(/)': 'repo',
    ':user/:repo/*path(/)': 'path',
    '*default': 'start',
  },

  initialize(options) {
    options = clone(options) || {};

    this.users = new Users();

    if (options.user) {
      this.user = options.user;
      this.users.add(this.user);
    }

    // Load up the main layout
    this.app = new AppView({
      el: '#prose',
      model: {},
      user: this.user,
    });

    this.app.render();
    this.app.loader.done();
  },

  chooseLanguage() {
    if (this.view) this.view.remove();

    this.app.loader.start(t('loading.file'));
    this.app.nav.mode('');

    this.view = new ChooseLanguageView();
    this.app.$el.find('#main').html(this.view.render().el);

    this.app.loader.done();
  },

  about() {
    if (this.view) this.view.remove();

    this.app.loader.start(t('loading.file'));
    this.app.nav.mode('');

    this.view = new DocumentationView();
    this.app.$el.find('#main').html(this.view.render().el);

    this.app.loader.done();
  },

  // #example-user
  // #example-organization
  profile(login) {
    if (this.view) this.view.remove();

    this.app.loader.start(t('loading.repos'));
    this.app.nav.mode('repos');

    util.documentTitle(login);

    let user = this.users.findWhere({ login });
    if (isUndefined(user)) {
      user = new User({ login });
      this.users.add(user);
    }

    const search = new SearchView({
      model: user.repos,
      mode: 'repos',
    });

    const repos = new ReposView({
      model: user.repos,
      search,
    });

    const content = new ProfileView({
      auth: this.user,
      search,
      sidebar: this.app.sidebar,
      repos,
      router: this,
      user,
    });

    user.fetch({
      success: (function (model, res, options) {
        this.view = content;
        this.app.$el.find('#main').html(this.view.render().el);

        model.repos.fetch({
          success: repos.render,
          error: (function (model, xhr, options) {
            this.error(xhr);
          }).bind(this),
          complete: this.app.loader.done,
        });
      }).bind(this),
      error: (function (model, xhr, options) {
        this.error(xhr);
      }).bind(this),
    });
  },

  // #example-user/example-repo
  // #example-user/example-repo/tree/example-branch/example-path
  repo(login, repoName, branch, path) {
    if (this.view instanceof RepoView
      && this.view.model.get('owner').login === login
      && this.view.model.get('name') === repoName
      && (this.view.branch === branch
        || (isUndefined(branch)
        && this.view.branch === this.view.model.get('default_branch'))
      )) {
      this.view.files.path = path || '';
      return this.view.files.render();
    } if (this.view) this.view.remove();

    this.app.loader.start(t('loading.repo'));
    this.app.nav.mode('repo');

    let title = repoName;
    if (branch) title = `${repoName}: /${path} at ${branch}`;
    util.documentTitle(title);

    let user = this.users.findWhere({ login });
    if (isUndefined(user)) {
      user = new User({ login });
      this.users.add(user);
    }

    let repo = findUserRepo(user, repoName);
    if (isUndefined(repo)) {
      repo = newRepo(user, repoName);
      user.repos.add(repo);
    }

    repo.fetch({
      success: (function (model, res, options) {
        const content = new RepoView({
          app: this.app,
          branch,
          model: repo,
          nav: this.app.nav,
          path,
          router: this,
          sidebar: this.app.sidebar,
        });

        this.view = content;
        this.app.$el.find('#main').html(this.view.render().el);
      }).bind(this),
      error: (function (model, xhr, options) {
        this.error(xhr);
      }).bind(this),
      complete: this.app.loader.done,
    });
  },

  path(login, repoName, path) {
    const url = util.extractURL(path);

    switch (url.mode) {
      case 'tree':
        this.repo(login, repoName, url.branch, url.path);
        break;
      case 'new':
      case 'blob':
      case 'edit':
      case 'preview':
        this.post(login, repoName, url.mode, url.branch, url.path);
        break;
      default:
        throw url.mode;
    }
  },

  post(login, repoName, mode, branch, path) {
    if (this.view) this.view.remove();

    this.app.nav.mode('file');

    switch (mode) {
      case 'new':
        this.app.loader.start(t('loading.creating'));
        break;
      case 'edit':
        this.app.loader.start(t('loading.file'));
        break;
      case 'preview':
        this.app.loader.start(t('loading.preview'));
        break;
    }

    let user = this.users.findWhere({ login });
    if (isUndefined(user)) {
      user = new User({ login });
      this.users.add(user);
    }

    let repo = findUserRepo(user, repoName);
    if (isUndefined(repo)) {
      repo = newRepo(user, repoName);
      user.repos.add(repo);
    }

    const file = {
      app: this.app,
      branch,
      branches: repo.branches,
      mode,
      nav: this.app.nav,
      name: util.extractFilename(path)[1],
      path,
      repo,
      router: this,
      sidebar: this.app.sidebar,
    };

    // TODO: defer this success function until both user and repo have been fetched
    // in paralell rather than in series
    user.fetch({
      success: (function (model, res, options) {
        repo.fetch({
          success: (function (model, res, options) {
            this.view = new FileView(file);
            this.app.$el.find('#main').html(this.view.el);
          }).bind(this),
          error: (function (model, xhr, options) {
            this.error(xhr);
          }).bind(this),
          complete: this.app.loader.done,
        });
      }).bind(this),
      error: (function (model, xhr, options) {
        this.error(xhr);
      }).bind(this),
    });
  },

  preview(login, repoName, mode, branch, path) {
    if (this.view) this.view.remove();

    this.app.loader.start(t('loading.preview'));

    let user = this.users.findWhere({ login });
    if (isUndefined(user)) {
      user = new User({ login });
      this.users.add(user);
    }

    let repo = findUserRepo(user, repoName);
    if (isUndefined(repo)) {
      repo = newRepo(user, repoName);
      user.repos.add(repo);
    }

    const file = {
      branch,
      branches: repo.branches,
      mode,
      nav: this.app.nav,
      name: util.extractFilename(path)[1],
      path,
      repo,
      router: this,
      sidebar: this.app.sidebar,
    };

    repo.fetch({
      success: (function (model, res, options) {
        // TODO: should this still pass through File view?
        this.view = new FileView(file);
        this.app.$el.find('#main').html(this.view.el);
      }).bind(this),
      error: (function (model, xhr, options) {
        this.error(xhr);
      }).bind(this),
      complete: this.app.loader.done,
    });
  },

  start() {
    if (this.view) this.view.remove();

    // If user has authenticated
    if (this.user) {
      this.navigate(this.user.get('login'), {
        trigger: true,
        replace: true,
      });
    } else {
      this.app.nav.mode('start');
      this.view = new StartView();
      this.app.$el.find('#main').html(this.view.render().el);
    }
  },

  notify(message, error, options) {
    if (this.view) this.view.remove();

    this.view = new NotificationView({
      message,
      error,
      options,
    });

    this.app.$el.find('#main').html(this.view.render().el);
    this.app.loader.stop();
  },

  error(xhr) {
    const message = [
      xhr.status,
      xhr.statusText,
    ].join(' ');

    let error = util.xhrErrorMessage(xhr);

    const options = [
      {
        title: t('notification.home'),
        link: '/',
      },
    ];

    if (xhr.status === 404 && !this.user) {
      error = t('notification.404');
      options.unshift({
        title: t('login'),
        link: `${Config.site}/login/oauth/authorize?client_id=${
          Config.id}&scope=${Config.scope}&redirect_uri=${
          encodeURIComponent(window.location.href)}`,
      });
    }

    this.notify(message, error, options);
  },
});
