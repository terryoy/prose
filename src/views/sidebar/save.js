import Backbone from 'backbone';
import { template } from 'lodash-es';

var NavView = require('../nav');
var templates = require('../../templates');
var util = require('../../util');

module.exports = Backbone.View.extend({
  template: templates.sidebar.save,

  events: {
    'change .commit-message': 'setMessage',
    'click a.cancel': 'emit',
    'click a.confirm': 'emit'
  },

  initialize: function(options) {
    this.sidebar = options.sidebar;
    this.file = options.file;

    // Re-render updated path in commit message
    this.listenTo(this.file, 'change:path', this.updatePlaceholder);
  },

  emit: function(e) {
    var action = $(e.currentTarget).data('action');
    this.sidebar.trigger(action, e);
    return false;
  },

  setMessage: function(e) {
    var value = e.currentTarget.value;
    this.file.set('message', value);
  },

  updatePlaceholder: function(model, value, options) {
    var name = util.extractFilename(value)[1];

    var placeholder = this.file.isNew() ?
      t('actions.commits.create', { filename: name }) :
      t('actions.commits.update', { filename: name });

    this.file.set('placeholder', placeholder);
    this.$el.find('.commit-message').attr('placeholder', placeholder);
  },

  render: function() {
    var writable = this.file.get('writable') ?
      t('sidebar.save.save') :
      t('sidebar.save.submit')

    this.$el.html(template(this.template, {
      variable: 'writable'
    })(writable));

    this.updatePlaceholder(this.file, this.file.get('path'));

    return this;
  }
});
