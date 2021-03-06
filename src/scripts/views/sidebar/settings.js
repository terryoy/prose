import Backbone from 'backbone';
import { template } from 'lodash-es';

// import NavView from '../nav';
// import util from '../../util';
import templates from '../../templates';

export default class SettingsView extends Backbone.View {
    template = templates.sidebar.settings;

    events = {
      'click a.delete': 'emit',
      'click a.toggle-editor': 'emit',
      'click a.translate': 'emit',
      'click a.draft': 'emit',
      'change input.filepath': 'setPath',
    };

    constructor(options) {
      super(options);
      this.delegateEvents();
      
      this.sidebar = options.sidebar;
      this.config = options.config;
      this.file = options.file;

      // fileInput is passed if a title replaces where it
      // normally is shown in the heading of the file.
      this.fileInput = options.fileInput;

      this.listenTo(this.file, 'change:path', this.updatePath);
    }

    emit = (e) => {
      if (e) e.preventDefault();

      const action = $(e.currentTarget).data('action');
      this.sidebar.trigger(action, e);
    }

    updatePath(model, value, options) {
    // Set path value from path attr in file model
      this.$el.find('input.filepath').attr('value', value);
    }

    setPath = (e) => {
      this.file.set('path', e.currentTarget.value);
      this.trigger('makeDirty');
      return false;
    }

    render() {
    // this.file.get('lang') is programming language
    // this.file.get('metadata').lang is ISO 639-1 language code
      const settings = {
        languages: this.config ? this.config.languages : [],
        lang: this.file.get('lang'),
        metadata: this.file.get('metadata'),
        fileInput: this.fileInput,
        path: this.file.get('path'),
      };

      this.$el.html(template(this.template, { variable: 'settings' })(settings));

      return this;
    }
}
