// var CodeMirror = require('codemirror');
import CodeMirror from 'codemirror';
import Backbone from 'backbone';
import { bindAll, template } from 'lodash-es';

var jsyaml = require('js-yaml');
import templates from '../../templates';
// var util = require('../../util');

module.exports = Backbone.View.extend({

  template: templates.meta.textarea,
  type: 'textarea',

  initialize: function(options) {
    this.options = options;
    bindAll(this, ['render', 'getValue', 'setValue', 'initCodeMirror']);
  },

  render: function () {
    var options = this.options;

    var textarea = {
      name: options.name,
      id: options.id,
      value: options.field.value,
      label: options.field.label,
      help: options.field.help,
      placeholder: options.field.placeholder,
      type: 'textarea'
    };

    this.setElement($(template(this.template, {
      variable: 'meta'
    })(textarea)));

    return this.$el;
  },

  // Initialize code mirror and save it to this.
  // Receives onBlur as a callback, which is a hook
  // to update the parent model.
  initCodeMirror: function (onBlur) {
    var id = this.id;
    var name = this.options.name;
    var textElement = document.getElementById(id);
    var codeMirror = CodeMirror(function(el) {
      textElement.parentNode.replaceChild(el, textElement);
      el.id = id;
      el.className += ' inner ';
      el.setAttribute('data-name', name);
    }, {
      mode: id,
      value: textElement.value,
      lineWrapping: true,
      theme: 'prose-bright'
    });

    codeMirror.on('blur', function() {
      onBlur({currentTarget: {
        value: codeMirror.getValue()
      }});
    });

    // Since other elements have a $form property shorthand
    // for the form element, make this consistent.
    this.codeMirror = codeMirror;
    this.$form = codeMirror;
    return codeMirror;
  },

  getValue: function() {

    // JS-yaml treats colons as delineating a key-value pair.
    // This is great for the raw editor but unexpected behavior
    // for the textarea field, which should behave as a longer
    // text field. Pre-escape colons here so they can be used.
    // https://github.com/prose/prose/issues/965
    try {
      var value = jsyaml.safeLoad(this.codeMirror.getValue().replace(/:/g, '&58;'));
      if (value === 0) { return value; }
      else return value ? value.replace(/&58;/g, ':') : '';
    }
    catch(err) {
      console.log('Error parsing yaml front matter for', this.options.name);
      console.log(err);
      return '';
    }
  },

  setValue: function(value) {
    // Only set value if not null or undefined.
    if (value != undefined) {
      this.codeMirror.setValue(value.replace(/&58;/g, ':'));
    }
  }
});
