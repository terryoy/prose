import Backbone from 'backbone';
import {
  extend, map, clone,
} from 'lodash-es';

import Branch from '../models/branch';
import util from '../util';

module.exports = Backbone.Collection.extend({
  model: Branch,

  initialize(models, options) {
    this.repo = options.repo;
  },

  parse(resp, options) {
    return map(resp, ((branch) => extend(branch, {
      repo: this.repo,
    })));
  },

  fetch(options) {
    options = clone(options) || {};

    const cb = options.success;

    var success = (function (res, statusText, xhr) {
      this.add(res);
      util.parseLinkHeader(xhr, {
        success,
        complete: cb,
      });
    }).bind(this);

    Backbone.Collection.prototype.fetch.call(this, extend(options, {
      success(model, res, options) {
        util.parseLinkHeader(options.xhr, {
          success,
          error: cb,
        });
      },
    }));
  },

  url() {
    return `${this.repo.url()}/branches?per_page=100`;
  },
});
