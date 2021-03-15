import Backbone from 'backbone';
import { template } from 'lodash-es';

import templates from '../../../templates';
import util from '../../../util';

export default class CommitView extends Backbone.View {
    template = templates.sidebar.li.commit;

    // events = {
    //   'mouseenter .removed': 'eventMessage',
    //   'mouseleave .removed': 'eventMessage',
    //   'click .removed': 'restore',
    // }

    constructor(options) {
      super({
        tagName: 'li',
        className: 'item',
        events: {
          'mouseenter .removed': 'eventMessage',
          'mouseleave .removed': 'eventMessage',
          'click .removed': 'restore',
        },
        ...options,
      });
      const { file } = options;

      this.branch = options.branch;
      this.file = file;
      this.files = options.repo.branches.findWhere({ name: options.branch }).files;
      this.repo = options.repo;
      this.view = options.view;
    }

    message(message) {
      this.$el.find('.message').html(message);
    }

    eventMessage = (e) => {
      switch (e.type) {
        case 'mouseenter':
          this.message(t('sidebar.repo.history.actions.restore'));
          break;
        case 'mouseleave':
          this.message(this.file.filename);
          break;
        default:
      }

      return false;
    }

    state(state) {
    // TODO: Set data-state attribute to toggle icon in CSS?
    // this.$el.attr('data-state', state);

      const $icon = this.$el.find('.ico');
      $icon.removeClass('added modified renamed removed saving checkmark error')
        .addClass(state);
    }

    restore = (e) => {
      const path = this.file.filename;

      // Spinning icon
      this.message(`${t('actions.restore.restoring')} ${path}`);
      this.state('saving');

      this.files.restore(this.file, {
        success: (function (model, res, options) {
          this.message(`${t('actions.restore.restored')}: ${path}`);
          this.state('checkmark');

          this.$el
            .attr('title', `${t('actions.restore.restored')}: ${this.file.filename}`);

          this.$el.find('a').removeClass('removed');

          // Re-render Files view once collection has updated
          this.view.files.render();
        }).bind(this),
        error: (function (model, xhr, options) {
          // Log actual error message
          this.message(['Error', xhr.status, xhr.statusText].join(' '));
          this.state('error');
        }).bind(this),
      });

      return false;
    }

    render() {
      const { file } = this;
      const binary = util.isBinary(file.filename);

      const data = {
        branch: this.branch,
        file,
        mode: binary ? 'tree' : 'edit',
        path: binary
          ? util.extractFilename(file.filename)[0] : file.filename,
        repo: this.repo.toJSON(),
        status: file.status,
      };

      const title = `${file.status.charAt(0).toUpperCase() + file.status.slice(1)
      }: ${file.filename}`;

      this.$el.attr('title', title)
        .html(template(this.template, { variable: 'data' })(data));

      return this;
    }
}
