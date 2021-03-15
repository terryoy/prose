// var chosen = require('chosen-jquery-browserify');

import Backbone from 'backbone';
import { template, invoke } from 'lodash-es';

import BranchView from './branch';
import templates from '../../templates';

export default class BranchesView extends Backbone.View {
    template = templates.sidebar.branches;

    subviews = {};

    constructor(options) {
      super(options);

      const { app } = options;
      app.loader.start();

      this.app = app;
      this.model = options.model;
      this.repo = options.repo;
      this.branch = options.branch || this.repo.get('default_branch');
      this.router = options.router;
      this.sidebar = options.sidebar;

      this.model.fetch({
        success: this.render,
        error: (model, xhr, options) => {
          this.router.error(xhr);
        },
        complete: this.app.loader.done,
      });
    }

    remove = (...args) => {
      invoke(this.subviews, 'remove');
      this.subviews = {};

      super.remove(...args);
      // Backbone.View.prototype.remove.apply(this, args);
    }

    render = () => {
    // only render branches selector if two or more branches
      if (this.model.length < 2) return;

      this.app.loader.start();

      this.$el.empty().append(template(this.template)());
      const frag = document.createDocumentFragment();

      this.model.forEach((branch, index) => {
        const view = new BranchView({
          model: branch,
          repo: this.repo,
          branch: this.branch,
        });

        frag.appendChild(view.render().el);
        this.subviews[branch.get('name')] = view;
      });

      this.$el.find('select').html(frag);

      const { router } = this;
      this.$el.find('.chzn-select').chosen().change(function () {
        router.navigate($(this).val(), true);
      });

      this.sidebar.open();

      this.app.loader.done();

      return this;
    }
}
