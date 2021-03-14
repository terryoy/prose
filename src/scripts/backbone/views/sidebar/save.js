import Backbone from 'backbone';
import { template } from 'lodash-es';

// import NavView from '../nav';
import templates from '../../templates';
import { t } from '../../translations';
import util from '../../util';

export default class SaveView extends Backbone.View {
    template = templates.sidebar.save;

    events = {
      'change .commit-message': 'setMessage',
      'click a.cancel': 'emit',
      'click a.confirm': 'emit',
    }

    constructor(options) {
      super(options);
      this.sidebar = options.sidebar;
      this.file = options.file;

      // Re-render updated path in commit message
      this.listenTo(this.file, 'change:path', this.updatePlaceholder);
    }

    emit = (e) => {
      const action = $(e.currentTarget).data('action');
      this.sidebar.trigger(action, e);
      return false;
    }

    setMessage = (e) => {
      const { value } = e.currentTarget;
      this.file.set('message', value);
    }

    updatePlaceholder(model, value, options) {
      const name = util.extractFilename(value)[1];

      const placeholder = this.file.isNew()
        ? t('actions.commits.create', { filename: name })
        : t('actions.commits.update', { filename: name });

      this.file.set('placeholder', placeholder);
      this.$el.find('.commit-message').attr('placeholder', placeholder);
    }

    render() {
      const writable = this.file.get('writable')
        ? t('sidebar.save.save')
        : t('sidebar.save.submit');

      this.$el.html(template(this.template, {
        variable: 'writable',
      })(writable));

      this.updatePlaceholder(this.file, this.file.get('path'));

      return this;
    }
}
