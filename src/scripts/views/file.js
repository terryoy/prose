import CodeMirror from 'codemirror';
import 'codemirror/mode/markdown/markdown';
import 'codemirror/mode/gfm/gfm';
import 'codemirror/mode/yaml/yaml';
import 'codemirror/mode/toml/toml';
import 'codemirror/mode/javascript/javascript';

import { Liquid } from 'liquidjs';
import {
  template, compact, has, delay, map, pairs, invoke, escape, extend,
} from 'lodash-es';
import { queue } from 'd3-queue';
import Handsontable from 'handsontable';

// var queue = require('queue-async');
import jsyaml from 'js-yaml';
import marked from 'marked';
import { diffLines } from 'diff';
import Papa from 'papaparse';

import Backbone from 'backbone';
import ModalView from './modal';
import { t } from '../translations';
import File from '../models/file';
import HeaderView from './header';
import ToolbarView from './toolbar';
import MetadataView from './metadata';
import { Config } from '../config';
import util from '../util';
import upload from '../upload';
import { cookie } from '../storage/cookie';
import templates from '../templates';

export default class FileView extends Backbone.View {
  id = 'post';

  template = templates.file;

  subviews = {};

  constructor(options) {
    super(options);

    const { app } = options;
    app.loader.start();

    // Patch Liquid
    // patch.apply(this);

    this.app = app;
    this.branch = options.branch || options.repo.get('default_branch');
    this.branches = options.branches;
    this.mode = options.mode;
    this.nav = options.nav;
    this.path = options.path || '';
    this.repo = options.repo;
    this.router = options.router;
    this.sidebar = options.sidebar;

    // Set the active nav element established by this.mode
    this.nav.setFileState(this.mode);

    // Events from vertical nav
    this.listenTo(this.nav, 'edit', this.edit);
    this.listenTo(this.nav, 'blob', this.blob);
    this.listenTo(this.nav, 'meta', this.meta);
    this.listenTo(this.nav, 'settings', this.settings);
    this.listenTo(this.nav, 'save', this.showDiff);

    // Events from sidebar
    this.listenTo(this.sidebar, 'destroy', this.destroy);
    this.listenTo(this.sidebar, 'toggle-editor', this.toggleEditor);
    this.listenTo(this.sidebar, 'draft', this.draft);
    this.listenTo(this.sidebar, 'cancel', this.cancel);
    this.listenTo(this.sidebar, 'confirm', this.updateFile);
    this.listenTo(this.sidebar, 'translate', this.translate);

    // bindAll(this, ['stashFile', 'setCollection', 'setModel']);

    // Stash editor and metadataEditor content to sessionStorage on pagehide event
    $(window).on('pagehide', this.stashFile);

    // Prevent exit when there are unsaved changes
    // jQuery won't bind to 'beforeunload' event
    // e.returnValue for Firefox compatibility
    // https://developer.mozilla.org/en-US/docs/Web/Reference/Events/beforeunload
    window.onbeforeunload = (e) => {
      if (this.dirty) {
        const message = t('actions.unsaved');
        (e || window.event).returnValue = message;

        return message;
      }
    };

    // 获取branches
    this.branches.fetch({
      success: this.setCollection,
      error: (model, xhr, options) => {
        this.router.error(xhr);
      },
      complete: app.loader.done,
    });
  }

  setCollection = (...args) => {
    this.app.loader.start();

    this.collection = this.branches.findWhere({ name: this.branch }).files;
    this.collection.fetch({
      success: this.setModel,
      error: (model, xhr, options) => {
        this.router.error(xhr);
      },
      complete: this.app.loader.done,
      args,
    });
  }

  setModel = () => {
    this.app.loader.start();

    // Set model either by calling directly for new File models
    // or by filtering collection for existing File models
    switch (this.mode) {
      case 'edit':
      case 'blob':
        this.model = this.collection.findWhere({ path: this.path });
        break;
      case 'preview':
        this.model = this.collection.findWhere({ path: this.path });
        if (!this.model) {
        // We may be trying to preview a new file that only has
        // stashed information lets check and create a dummy model
          const previewPath = this.absolutePathFromComponents(
            this.repo.get('owner').login,
            this.repo.get('name'),
            this.branch,
            this.path,
          );
          if (this.getStashForPath(previewPath)) {
            this.model = this.newEmptyFile();
          }
        }
        break;
      case 'new':
        this.model = this.newEmptyFile();
        break;
      default:
    }

    // Set default metadata from collection
    const { defaults } = this.collection;
    let path;
    if (this.model) {
      if (defaults) {
        path = this.nearestPath(this.model.get('path'), defaults);
        this.model.set('defaults', defaults[path]);
      }

      // Render on complete to render even if model does not exist on remote yet
      this.model.fetch({
        complete: (function () {
          this.app.loader.done();
          this.render();
        }).bind(this),
      });
    } else {
      this.router.notify(
        t('notification.error.exists'),
        undefined,
        [
          {
            title: t('notification.create'),
            className: 'create',
            link: '#',
          },
          {
            title: t('notification.back'),
            link: `#${compact([
              this.repo.get('owner').login,
              this.repo.get('name'),
              'tree',
              this.branch,
              util.extractFilename(this.path)[0],
            ]).join('/')}`,
          },
        ],
      );

      this.app.loader.done();
    }
  }

  newEmptyFile() {
    return new File({
      branch: this.branches.findWhere({ name: this.branch }),
      collection: this.collection,
      path: this.path,
      repo: this.repo,
    });
  }

  nearestPath(path, defaults) {
    // Match nearest parent directory default metadata
    // Match paths in _drafts to corresponding defaults set at _posts
    path = path.replace(/^(_drafts)/, '_posts');
    const nearestDir = /\/?(?!.*\/).*$/;

    while (!has(defaults, path) && nearestDir.test(path) && path) {
      path = path.replace(nearestDir, '');
    }

    return path;
  }

  cursor = () => {
    const view = this;
    const selection = util.trim(this.editor.getSelection());

    const match = {
      lineBreak: /\n/,
      h1: /^#{1}/,
      h2: /^#{2}/,
      h3: /^#{3}/,
      h4: /^#{4}/,
      strong: /^__([\s\S]+?)__(?!_)|^\*\*([\s\S]+?)\*\*(?!\*)/,
      italic: /^\b_((?:__|[\s\S])+?)_\b|^\*((?:\*\*|[\s\S])+?)\*(?!\*)/,
      isNumber: parseInt(selection.charAt(0), 10),
    };

    if (!match.isNumber) {
      switch (selection.charAt(0)) {
        case '#':
          if (!match.lineBreak.test(selection)) {
            if (match.h3.test(selection) && !match.h4.test(selection)) {
              this.toolbar.highlight('sub-heading');
            } else if (match.h2.test(selection) && !match.h3.test(selection)) {
              this.toolbar.highlight('heading');
            }
          }
          break;
        case '>':
          this.toolbar.highlight('quote');
          break;
        case '*':
        case '_':
          if (!match.lineBreak.test(selection)) {
            if (match.strong.test(selection)) {
            // trigger a change
              this.toolbar.highlight('bold');
            } else if (match.italic.test(selection)) {
              this.toolbar.highlight('italic');
            }
          }
          break;
        case '!':
          if (!match.lineBreak.test(selection)
              && selection.charAt(1) === '['
              && selection.charAt(selection.length - 1) === ')') {
            this.toolbar.highlight('media');
          }
          break;
        case '[':
          if (!match.lineBreak.test(selection)
              && selection.charAt(selection.length - 1) === ')') {
            this.toolbar.highlight('link');
          }
          break;
        case '-':
          if (selection.charAt(1) === ' ') {
            this.toolbar.highlight('list');
          }
          break;
        default:
          if (this.toolbar) this.toolbar.highlight();
          break;
      }
    } else if (selection.charAt(1) === '.' && selection.charAt(2) === ' ') {
      this.toolbar.highlight('numbered-list');
    }
  }

  compilePreview(content) {
    // Scan the content search for ![]()
    // grab the path and file and form a RAW github aboslute request for it
    const scan = /\!\[([^\[]*)\]\(([^\)]+)\)/g;
    const image = /\!\[([^\[]*)\]\(([^\)]+)\)/;
    const titleAttribute = /".*?"/;

    // Build an array of found images
    const results = content.match(scan) || [];

    // Iterate over the results and replace
    results.forEach((r) => {
      const parts = (image).exec(r);
      let path;

      if (parts !== null) {
        path = parts[2];

        if (!util.absolutePath(path)) {
          // Remove any title attribute in the image tag is there is one.
          if (titleAttribute.test(path)) {
            path = path.split(titleAttribute)[0];
          }

          // Remove {{site.baseurl}}
          path = path.replace('{{site.baseurl}}/', '/');

          // Prepend directory path if not site root relative
          path = /^\//.test(path) ? path.slice(1)
            : `${util.extractFilename(this.model.get('path'))[0]}/${path}`;

          const url = `${Config.site}/${this.repo.get('owner').login}/${this.repo.get('name')}/blob/${this.branch}/${window.escape(path)}?raw=true`;

          content = content.replace(r, `![${parts[1]}](${url})`);
        }
      }
    });

    return escape(content);
  }

  toggleEditor = () => {
    cookie.set('disableCSVEditor', !cookie.get('disableCSVEditor'));
    this.render();
  }

  parseCSV(csvString) {
    return Papa.parse(util.trim(csvString), { // remove trailing whitespace, mholt/PapaParse#279
      skipEmptyLines: true,
    });
  }

  initCSVEditor() {
    const self = this;

    const $container = this.$el.find('#csv');
    const container = $container[0];
    const data = this.parseCSV(this.model.get('content'));

    const distanceFromTop = $container.offset().top;
    const documentHeight = $(document).height();
    const editorHeight = documentHeight - distanceFromTop;

    this.editor = new Handsontable(container, {
      data: data.data,
      colHeaders: true,
      rowHeaders: true,
      stretchH: 'all',
      height: editorHeight,
      fixedRowsTop: 1,
      manualColumnResize: true,
      manualRowResize: true,
      contextMenu: ['row_above', 'row_below', 'col_left', 'col_right', 'remove_row', 'remove_col', 'undo', 'redo'],
      undo: true,
      afterChange(changes, source) {
        if (source !== 'loadData') self.makeDirty();
      },
      afterRemoveCol: this.makeDirty,
      afterRemoveRow: this.makeDirty,
      afterCreateCol: this.makeDirty,
      afterCreateRow: this.makeDirty,
    });

    this.editor.getValue = function () {
      return Papa.unparse(this.getSourceData());
    };

    this.editor.setValue = function (newValue) {
      const parsedValue = self.parseCSV(newValue);
      this.loadData(parsedValue.data);
      self.makeDirty();
    };

    // Check sessionStorage for existing stash
    // Apply if stash exists and is current, remove if expired
    this.stashApply();
  }

  initEditor() {
    const lang = this.model.get('lang');

    const code = this.$el.find('#code')[0];
    code.value = this.model.get('content') || '';
    // TODO: set default content for CodeMirror
    this.editor = CodeMirror.fromTextArea(code, {
      mode: lang,
      lineWrapping: true,
      lineNumbers: !((lang === 'gfm' || lang === null)),
      extraKeys: this.keyMap(),
      matchBrackets: true,
      dragDrop: false,
      theme: 'prose-bright',
    });

    // Bind Drag and Drop work on the editor
    if (this.model.get('markdown') && this.model.get('writable')) {
      upload.dragDrop(this.$el, (e, file, content) => {
        if (this.$el.find('#dialog').hasClass('dialog')) {
          this.updateImageInsert(e, file, content);
        } else {
          // Clear selection
          this.editor.focus();
          this.editor.replaceSelection('');

          // Append images links in this.upload()
          this.upload(e, file, content);
        }
      });
    }

    // Monitor the current selection and apply
    // an active class to any snippet links
    if (lang === 'gfm') {
      this.listenTo(this.editor, 'cursorActivity', this.cursor.bind(this));
    }

    this.listenTo(this.editor, 'change', this.makeDirty.bind(this));
    this.listenTo(this.editor, 'focus', this.focus.bind(this));

    this.refreshCodeMirror();

    // Check sessionStorage for existing stash
    // Apply if stash exists and is current, remove if expired
    this.stashApply();
  }

  keyMap() {
    const self = this;

    if (this.model.get('markdown')) {
      return {
        // [Keyboard shortcuts]: callback (codemirror) => {}
        'Ctrl-Enter': function () {
          self.blob();
        },
        'Ctrl-S': function () {
          self.updateFile();
        },
        'Cmd-B': function () {
          if (self.editor.getSelection() !== '') self.toolbar.bold(self.editor.getSelection());
        },
        'Ctrl-B': function () {
          if (self.editor.getSelection() !== '') self.toolbar.bold(self.editor.getSelection());
        },
        'Cmd-I': function () {
          if (self.editor.getSelection() !== '') self.toolbar.italic(self.editor.getSelection());
        },
        'Ctrl-I': function () {
          if (self.editor.getSelection() !== '') self.toolbar.italic(self.editor.getSelection());
        },
      };
    }
    return {
      'Ctrl-S': function () {
        self.updateFile();
      },
    };
  }

  focus() {
    // If an upload queue is set, we want to clear it.
    this.queue = undefined;

    // If a dialog window is open and the editor is in focus, close it.
    this.$el.find('.toolbar .group a').removeClass('on');
    this.$el.find('#dialog').empty().removeClass();
  }

  initToolbar() {
    this.toolbar = new ToolbarView({
      view: this,
      file: this.model,
      collection: this.collection,
      config: this.config,
    });

    this.subviews.toolbar = this.toolbar;
    this.toolbar.setElement(this.$el.find('#toolbar')).render();

    this.listenTo(this.toolbar, 'updateImageInsert', this.updateImageInsert);
    this.listenTo(this.toolbar, 'post', this.post);
  }

  titleAsHeading() {
    // If the file is Markdown, has metadata for a title,
    // the editable field in the header should be
    // the title of the Markdown document.
    const metadata = this.model.get('metadata');

    if (this.model.get('markdown')) {
      // 1. A title exists in a files current metadata
      if (metadata && metadata.title) {
        return metadata.title;

        // 2. A title does not exist and should be checked in the defaults
      } if (this.model.get('defaults')) {
        const defaultTitle = this.model.get('defaults').find((t) => t.name == 'title');

        if (defaultTitle) {
          if (defaultTitle.field && defaultTitle.field.value) {
            return defaultTitle.field.value;
          }

          // 3. If a title entry is in the defaults but with no
          // default value, use an untitled placeholder message.
          // return t('main.file.noTitle');
          return t('main.file.noTitle');
        }
        return false;
      }

      // This is not a Markdown post, bounce
      // TODO: Should this handle _posts/name.html?
      return false;
    }
  }

  initSidebar() {
    // Settings sidebar panel
    this.settings = this.sidebar.initSubview('settings', {
      sidebar: this.sidebar,
      config: this.collection.config,
      file: this.model,
      fileInput: this.titleAsHeading(),
    }).render();
    this.subviews.settings = this.settings;

    this.listenTo(this.sidebar, 'makeDirty', this.makeDirty);

    // Commit message sidebar panel
    this.save = this.sidebar.initSubview('save', {
      sidebar: this.sidebar,
      file: this.model,
    }).render();
    this.subviews.save = this.save;
  }

  initHeader() {
    const title = this.titleAsHeading();
    const input = title || this.model.get('path');

    this.header = new HeaderView({
      input,
      title: !!title,
      file: this.model,
      repo: this.repo,
      alterable: true,
      placeholder: this.model.isNew() && !this.model.translate && !this.model.isClone(),
    });

    this.subviews.header = this.header;
    this.header.setElement(this.$el.find('#heading')).render();
    this.listenTo(this.header, 'makeDirty', this.makeDirty);
  }

  renderMetadata() {
    this.metadataEditor = new MetadataView({
      model: this.model,
      titleAsHeading: this.titleAsHeading(),
      view: this,
    });

    this.metadataEditor.setElement(this.$el.find('#meta')).render();
    this.subviews.metadata = this.metadataEditor;
  }

  render() {
    this.app.loader.start();

    if (this.mode === 'preview') {
      this.preview();
    } else {
      const content = this.model.get('content');

      const file = {
        markdown: this.model.get('markdown'),
        lang: this.model.get('lang'),
        useCSVEditor: (['csv', 'tsv'].indexOf(this.model.get('lang')) !== -1 && !cookie.get('disableCSVEditor')),
      };

      this.$el.empty().append(template(this.template, {
        variable: 'file',
      })(file));

      // Store the configuration object from the collection
      this.config = this.model.get('collection').config;

      // initialize the subviews
      if (file.useCSVEditor) {
        this.initCSVEditor();
      } else {
        this.initEditor();
      }
      this.initHeader();
      this.initToolbar();
      this.initSidebar();

      const mode = ['file'];
      const markdown = this.model.get('markdown');
      const jekyll = /^(_posts|_drafts)/.test(this.model.get('path'));

      // Update the navigation view with menu options
      // if a file contains metadata, has default metadata or is Markdown (except CSVs)
      if (!file.useCSVEditor && (this.model.get('metadata') || this.model.get('defaults') || (markdown && jekyll))) {
        this.renderMetadata();

        mode.push('meta');
      }

      if (markdown || this.model.get('extension') === 'html') mode.push('preview');
      if (!this.model.isNew()) mode.push('settings');

      this.nav.mode(mode.join(' '));

      this.updateDocumentTitle();

      // Preview needs access to marked, so it's registered here
      /*
      Liquid.Template.registerFilter({
        'markdownify': function(input) {
          return marked(input || '');
        }
      });
      */

      if (this.model.get('markdown') && this.mode === 'blob') {
        this.blob();
      } else {
        // Editor is first up so trigger an active class for it
        this.$el.find('#edit').toggleClass('active', true);
        this.$el.find('.file .edit').addClass('active');

        if (this.model.get('markdown')) {
          util.fixedScroll(this.$el.find('.topbar'), 90);
        }
      }

      if (this.mode === 'blob') {
        this.blob();
      }
    }

    this.app.loader.done();

    return this;
  }

  updateDocumentTitle() {
    const context = (this.mode === 'blob' ? t('docheader.preview') : t('docheader.editing'));

    const path = this.model.get('path');
    const pathTitle = path || '';

    util.documentTitle(`${context} ${pathTitle}/${this.model.get('name')} at ${this.branch}`);
  }

  edit = () => {
    const view = this;
    this.sidebar.close();

    // If preview was hit on load this.editor
    // was not initialized.
    if (!this.editor) {
      this.initEditor();

      if (this.model.get('markdown')) {
        delay(() => {
          util.fixedScroll($('.topbar', view.el), 90);
        }, 1);
      }
    }

    $('#prose').toggleClass('open', false);

    this.contentMode('edit');
    this.mode = this.model.isNew() ? 'new' : 'edit';
    this.nav.setFileState(this.mode);
    this.updateURL();
  }

  blob = (e) => {
    this.sidebar.close();

    const metadata = this.model.get('metadata');
    const jekyll = this.config && this.config.siteurl && metadata && metadata.layout;

    if (jekyll && e) {
      // TODO: this could all be removed if preview button listened to
      // change:path event on model
      this.nav.setFileState('edit'); // Return to edit because we are creating a new window
      this.stashFile();

      const hash = this.absoluteFilepath().split('/');
      hash.splice(2, 0, 'preview');
      $(e.currentTarget).attr({
        target: '_blank',
        href: `#${hash.join('/')}`,
      });
    } else {
      if (e) e.preventDefault();

      this.$el.find('#preview').html(marked(this.compilePreview(this.model.get('content'))));

      this.mode = 'blob';
      this.contentMode('preview');
      this.nav.setFileState('blob');
      this.updateURL();
    }
  }

  preview = () => {
    const q = queue(1);
    // Retrieve the stash from the model path because thats what would
    // have been stored when the preview button is clicked
    const stash = this.getStashForPath(this.absolutePathFromFile(this.model));
    let metadata = {};
    let content = '';
    if (stash && stash.content) {
      metadata = stash.metadata;
      content = stash.content;
    } else {
      metadata = this.model.get('metadata') || {};
      content = this.model.get('content') || '';
    }

    // Run the liquid parsing.
    let parsedTemplate = Liquid.parse(this.compilePreview(content)).render({
      site: this.collection.config,
      post: metadata,
      page: metadata,
    });

    // If it's markdown, run it through marked; otherwise, leave it alone.
    if (this.model.get('markdown')) parsedTemplate = marked(parsedTemplate);

    const p = {
      site: this.collection.config,
      post: metadata,
      page: metadata,
      content: parsedTemplate || '',
    };

    // Grab a date from the filename
    // and add this post to be evaluated as {{post.date}}
    const parts = util.extractFilename(this.path)[1].split('-');
    const year = parts[0];
    const month = parts[1];
    const day = parts[2];

    // TODO: remove EST specific time adjustment
    const date = `${[year, month, day].join('-')} 05:00:00`;

    try {
      p.post.date = jsyaml.safeLoad(date).toDateString();
    } catch (err) {
      console.log('Error parsing date');
      console.log(err);
    }

    // Parse JSONP links
    if (p.site && p.site.site) {
      p.site.site.forEach((file, key) => {
        q.defer((cb) => {
          let next = false;
          $.ajax({
            cache: true,
            dataType: 'jsonp',
            jsonp: false,
            jsonpCallback: 'callback',
            url: file,
            timeout: 5000,
            success(d) {
              p.site[key] = d;
              next = true;
              cb();
            },
            error(msg, b, c) {
              if (!next) cb();
            },
          });
        });
      });
    }

    function getLayout(cb) {
      const file = p.page.layout;
      const layout = this.collection.findWhere({ path: `_layouts/${file}.html` });

      layout.fetch({
        success: (model, res, options) => {
          model.getContent({
            success: (model, res, options) => {
              const meta = model.get('metadata');
              const content = model.get('content');
              const template = Liquid.parse(content);

              p.page = extend(metadata, meta);

              p.content = template.render({
                site: p.site,
                post: p.post,
                page: p.page,
                content: p.content,
              });

              // Handle nested layouts
              if (meta && meta.layout) q.defer(getLayout.bind(this));

              cb();
            },
            error: (model, xhr, options) => {
              this.router.error(xhr);
            },
          });
        },
        error: (model, xhr, options) => {
          this.router.error(xhr);
        },
      });
    }

    if (p.page.layout) {
      q.defer(getLayout.bind(this));
    }

    q.await((() => {
      const { config } = this.collection;
      let { content } = p;

      // Set base URL to public site
      if (config && Config.siteurl) {
        content = content.replace(/(<head(?:.*)>)/, (function () {
          return `${arguments[1]}<base href="${Config.siteurl}">`;
        }));
      }

      document.write(content);
      document.close();
    }));
  }

  contentMode(mode) {
    this.$el.find('.views .view').removeClass('active');
    if (mode) {
      this.$el.find(`#${mode}`).addClass('active');
    } else if (this.mode === 'blob') {
      this.$el.find('#preview').addClass('active');
    } else {
      this.$el.find('#edit').addClass('active');
    }
  }

  meta = () => {
    this.sidebar.close();
    this.contentMode('meta');

    // Refresh any textarea's in the frontmatter form that use codemirror
    this.metadataEditor.refresh();
  }

  destroy = () => {
    if (confirm(t('actions.delete.warn'))) {
      this.model.destroy({
        success: (function () {
          this.router.navigate([
            this.repo.get('owner').login,
            this.repo.get('name'),
            'tree',
            this.branch,
          ].join('/'), true);
        }).bind(this),
        error: (function (model, xhr, options) {
          this.router.error(xhr);
        }).bind(this),
      });
    }
  }

  updateURL() {
    const url = compact([
      this.repo.get('owner').login,
      this.repo.get('name'),
      this.mode,
      this.branch,
      this.path,
    ]);

    this.router.navigate(url.join('/'), {
      trigger: false,
      replace: true,
    });

    this.updateDocumentTitle();

    // TODO: what is this updating?
    this.$el.find('.chzn-select').trigger('liszt:updated');
  }

  makeDirty = (e) => {
    this.dirty = true;

    // Update Content.
    if (this.editor && this.editor.getValue) {
      this.model.set('content', this.editor.getValue());
    }

    const label = this.model.get('writable')
      ? t('actions.change.save')
      : t('actions.change.submit');

    this.updateSaveState(label, 'save');
  }

  settings = () => {
    this.contentMode();
    this.sidebar.mode('settings');
    this.sidebar.open();
  }

  showDiff = () => {
    this.contentMode('diff');
    this.sidebar.mode('save');
    this.sidebar.open();

    const $diff = this.$el.find('#diff');

    // Use escape() to prevent rendering HTML tags
    const text1 = this.model.isNew() ? '' : escape(this.model.get('previous'));
    const text2 = escape(this.model.serialize());

    const d = diffLines(text1, text2);
    const { length } = d;
    let compare = '';

    for (let i = 0; i < length; i++) {
      if (d[i].removed) {
        compare += `<del>${d[i].value}</del>`;
      } else if (d[i].added) {
        compare += `<ins>${d[i].value}</ins>`;
      } else {
        compare += d[i].value;
      }
    }

    $diff.find('.diff-content').html(`<pre>${compare}</pre>`);
  }

  cancel = () => {
    // Close the sidebar and return the
    // active nav item to the current file mode.
    this.sidebar.close();
    this.nav.active(this.mode);

    // Return back to old mode.
    this.contentMode();
  }

  refreshCodeMirror() {
    if (typeof this.editor.refresh === 'function') this.editor.refresh();
  }

  updateMetaData() {
    if (!this.model.jekyll) return true; // metadata -> skip
    this.model.metadata = this.metadataEditor.getValue();
    return true;
  }

  patch() {
    // Submit a patch (fork + pull request workflow)
    this.updateSaveState(t('actions.save.patch'), 'saving');

    // view.updateMetaData();

    this.model.patch({
      success: (function (res) {
        /*
        // TODO: revert to previous state?
        var previous = view.model.get('previous');
        this.model.content = previous;
        this.editor.setValue(previous);
        this.dirty = false;
        this.model.persisted = true;
        this.model.file = filename;
        this.model.set('previous', filecontent);
        */

        // TODO: why is this breaking?
        // this.toolbar.updatePublishState();

        this.updateURL();
        this.sidebar.close();
        this.updateSaveState(t('actions.save.submission'), 'saved');
      }).bind(this),
      error: (function (model, xhr, options) {
        const message = util.xhrErrorMessage(xhr);
        this.updateSaveState(message, 'error');
      }).bind(this),
    });
  }

  filepath() {
    if (this.titleAsHeading()) {
      return this.sidebar.filepathGet();
    }
    return this.header.inputGet();
  }

  absoluteFilepath() {
    return this.absolutePathFromComponents(
      this.repo.get('owner').login,
      this.repo.get('name'),
      this.branch,
      this.filepath(),
    );
  }

  absolutePathFromFile(file) {
    return this.absolutePathFromComponents(
      file.collection.repo.get('owner').login,
      file.collection.repo.get('name'),
      file.collection.branch.get('name'),
      file.get('path'),
    );
  }

  absolutePathFromComponents(user, repo, branch, path) {
    const url = compact([user, repo, branch, path]);
    return url.join('/');
  }

  draft = () => {
    const defaults = this.collection.defaults || {};
    const path = this.model.get('path').replace(/^(_posts)/, '_drafts');
    let url;

    // Create File model clone with metadata and content
    // Reassign this.model to clone and re-render
    this.model = this.collection.get(path) || this.model.clone({
      path,
    });

    // Set default metadata for new path
    if (this.model && defaults) {
      this.model.set('defaults', defaults[this.nearestPath(path, defaults)]);
    }

    // Update view properties
    this.path = path;

    url = compact([
      this.repo.get('owner').login,
      this.repo.get('name'),
      this.mode,
      this.branch,
      this.path,
    ]);

    this.router.navigate(url.join('/'), {
      trigger: false,
    });

    this.sidebar.close();
    this.nav.active('edit');

    this.model.fetch({ complete: this.render });
  }

  post = (e) => {
    const defaults = this.collection.defaults || {};
    const metadata = this.model.get('metadata') || {};
    const content = this.model.get('content') || '';
    const path = this.model.get('path').replace(/^(_drafts)/, '_posts');
    let url;

    // Create File model clone with metadata and content
    // Reassign this.model to clone and re-render
    this.model = this.collection.get(path) || this.model.clone({
      path,
    });

    // Set default metadata for new path
    if (this.model && defaults) {
      this.model.set('defaults', defaults[this.nearestPath(path, defaults)]);
    }

    // Update view properties
    this.path = path;

    url = compact([
      this.repo.get('owner').login,
      this.repo.get('name'),
      this.mode,
      this.branch,
      this.path,
    ]);

    this.router.navigate(url.join('/'), {
      trigger: false,
    });

    this.model.fetch({
      complete: (function (model, res, options) {
        // Set metadata and content from draft on post model
        this.model.set('metadata', metadata);
        this.model.set('content', content);

        this.render();

        this.nav.active('save');
        this.showDiff();
      }).bind(this),
    });
  }

  translate = (e) => {
    const defaults = this.collection.defaults || {};
    const metadata = this.model.get('metadata') || {};
    const lang = $(e.currentTarget).attr('href').substr(1);
    let path = this.model.get('path').split('/');
    let model;
    let url;

    // TODO: Drop the 'en' requirement.
    if (lang === 'en') {
      // If current page is not english and target page is english
      path.splice(-2, 2, path[path.length - 1]);
    } else if (metadata.lang === 'en') {
      // If current page is english and target page is not english
      path.splice(-1, 1, lang, path[path.length - 1]);
    } else {
      // If current page is not english and target page is not english
      path.splice(-2, 2, lang, path[path.length - 1]);
    }

    path = compact(path).join('/');

    const categories = (metadata.categories || []);
    categories.unshift(lang);

    this.model = this.collection.get(path) || this.model.clone({
      metadata: {
        categories,
        lang,
      },
      path,
    });

    // Set default metadata for new path
    if (this.model && defaults) {
      this.model.set('defaults', defaults[this.nearestPath(path, defaults)]);
    }

    // Update view properties
    this.path = path;

    url = compact([
      this.repo.get('owner').login,
      this.repo.get('name'),
      this.mode,
      this.branch,
      this.path,
    ]);

    this.router.navigate(url.join('/'), {
      trigger: false,
    });

    this.sidebar.close();
    this.model.fetch({ complete: this.render });
  }

  stashFile = (e) => {
    if (e) e.preventDefault();
    if (!window.sessionStorage || !this.dirty) return false;

    const store = window.sessionStorage;
    const filepath = this.absoluteFilepath();
    // Don't stash if filepath is undefined
    if (filepath) {
      try {
        store.setItem(filepath, JSON.stringify({
          sha: this.model.get('sha'),
          content: this.editor ? this.editor.getValue() : null,
          metadata: this.metadataEditor ? this.metadataEditor.getValue() : null,
        }));
      } catch (err) {
        console.log(err);
      }
    }
  }

  stashApply() {
    const filepath = this.absolutePathFromFile(this.model);
    const stash = this.getStashForPath(filepath);
    if (!stash) return false;
    if (stash.sha === this.model.get('sha')) {
      // Restore from stash if file sha hasn't changed
      if (this.editor && this.editor.setValue) this.editor.setValue(stash.content);
      if (this.metadataEditor) {
        // this.rawEditor.setValue('');
        this.metadataEditor.setValue(stash.metadata);
      }
    } else {
      // Remove expired content
      this.clearStashForPath(filepath);
    }
  }

  getStashForPath(filepath) {
    if (!window.sessionStorage) return false;
    const store = window.sessionStorage;
    const item = store.getItem(filepath);
    return JSON.parse(item);
  }

  clearStashForPath(filepath) {
    if (!window.sessionStorage) return;
    const store = window.sessionStorage;
    store.removeItem(filepath);
  }

  updateFile = () => {
    const view = this;

    // Trigger the save event
    this.updateSaveState(t('actions.save.saving'), 'saving');

    const isWritable = this.model.get('writable');
    const method = isWritable ? this.model.save : this.patch;
    const delegateObj = isWritable ? this.model : this;

    // this.updateSaveState(t('actions.save.metaError'), 'error');
    // this.updateSaveState(t('actions.error'), 'error');
    // this.updateSaveState(t('actions.save.saved'), 'saved', true);
    // this.updateSaveState(t('actions.save.fileNameError'), 'error');

    // Validation checking
    this.model.on('invalid', ((model, error) => {
      this.updateSaveState(error, 'error');

      view.modal = new ModalView({
        message: error,
      });

      view.$el.find('#modal').html(view.modal.el);
      view.modal.render();
    }));

    // Update content
    this.model.content = (this.editor) ? this.editor.getValue() : '';

    // Delegate
    method.call(delegateObj, {
      success: (function (model, res, options) {
        let url;
        let data;
        let params;

        this.sidebar.close();
        this.updateSaveState(t('actions.save.saved'), 'saved');

        // Enable settings sidebar item
        this.nav.$el.addClass('settings');

        // Update current path
        const path = model.get('path');
        this.path = path;

        // Unset dirty, remove session storage, return to edit view
        this.dirty = false;
        this.clearStashForPath(this.absoluteFilepath());
        this.edit();

        const old = model.get('oldpath');
        const name = util.extractFilename(old)[1];
        const pathChange = path !== old;

        // Remove old file if renamed
        // TODO: remove this when Repo Contents API supports renaming
        if (model.previous('sha') && pathChange) {
          url = model.url().replace(path, old).split('?')[0];

          data = {
            path: old,
            message: t('actions.commits.delete', { filename: name }),
            sha: model.previous('sha'),
            branch: this.collection.branch.get('name'),
          };

          params = map(pairs(data), (param) => param.join('=')).join('&');

          $.ajax({
            type: 'DELETE',
            url: `${url}?${params}`,
            error: (function (xhr, textStatus, errorThrown) {
              const message = util.xhrErrorMessage(xhr);
              this.updateSaveState(message, 'error');
            }).bind(this),

            // Update oldpath so that if the file is renamed more than once, we
            // don't end up with multiple copies of it
            success() {
              model.set('oldpath', path);
            },

          });
        } else if (pathChange) {
          // Update oldpath so that if the file is renamed more than once, we
          // don't end up with multiple copies of it
          model.set('oldpath', path);
        }
      }).bind(this),
      error: (function (model, xhr, options) {
        const message = util.xhrErrorMessage(xhr);
        this.updateSaveState(message, 'error');
      }).bind(this),
    });

    return false;
  }

  updateSaveState(label, classes, kill) {
    // Cancel if this condition is met
    if (classes === 'save' && $(this.el).hasClass('saving')) return;

    // Update the Sidebar save button
    if (this.sidebar) this.sidebar.updateState(label);

    // Update the avatar in the toolbar
    if (this.nav) this.nav.updateState(label, classes, kill);
  }

  updateImageInsert = (e, file, content) => {
    const path = (this.toolbar.mediaDirectoryPath)
      ? this.toolbar.mediaDirectoryPath
      : util.extractFilename(this.toolbar.file.attributes.path)[0];
    const src = `${path}/${encodeURIComponent(file.name)}`;

    this.$el.find('input[name="url"]').val(src);
    this.$el.find('input[name="alt"]').val('');

    this.toolbar.queue = {
      e,
      file,
      content,
    };
  }

  defaultUploadPath(fileName) {
    // Default to media directory if defined in config,
    // current directory if no path specified
    const dir = (this.config && this.config.media) ? this.config.media
      : util.extractFilename(this.model.get('path'))[0];

    return compact([dir, fileName]).join('/');
  }

  upload = (e, file, content, path) => {
    // Loading State
    this.updateSaveState(t('actions.upload.uploading', { file: file.name }), 'saving');

    const uploadPath = path || this.defaultUploadPath(file.name);
    this.collection.upload(file, content, uploadPath, {
      success: (function (model, res, options) {
        const { name } = res.content;
        const path = `{{site.baseurl}}/${res.content.path}`;

        // Take the alt text from the insert image box on the toolbar
        const $alt = $('input[name="alt"]');
        const value = $alt.val();
        const image = (value)
          ? `![${value}](${path})`
          : `![${name}](${path})`;

        this.editor.focus();
        this.editor.replaceSelection(`${image}\n`, 'end');
        this.updateSaveState('Saved', 'saved', true);
      }).bind(this),
      error: (function (model, xhr, options) {
        const message = util.xhrErrorMessage(xhr);
        this.updateSaveState(message, 'error');
      }).bind(this),
    });
  }

  remove(...args) {
    // Unbind beforeunload prompt
    window.onbeforeunload = null;

    // So we don't endlessly stash when choosing new files
    $(window).off('pagehide', this.stashFile);

    // Reset dirty models on navigation
    if (this.dirty) {
      this.stashFile();
      this.model.fetch();
    }

    invoke(this.subviews, 'remove');
    this.subviews = {};

    // Clear any file state classes in #prose
    this.updateSaveState('', '');

    super.remove(...args);
  }
}
