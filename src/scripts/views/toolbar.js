// var chosen = require('chosen-jquery-browserify');

import Backbone from 'backbone';
import { extend, template } from 'lodash-es';

import { t } from '../translations';
import templates from '../templates';

import upload from '../upload';
import util from '../util';

import toolbar from './toolbar/markdown';

export default class ToolbarView extends Backbone.View {
  template = templates.toolbar;

  events = {
    'click .group a': 'markdownSnippet',
    'click .publish-flag': 'togglePublishing',
    'change #upload': 'fileInput',
    'click .dialog .insert': 'dialogInsert',
    'click .draft-to-post': 'post',
  };

  constructor(options) {
    super(options);

    const self = this;
    this.file = options.file;
    this.view = options.view;
    this.collection = options.collection;
    const { config } = options;

    if (config) {
      this.hasMedia = !!(config.media);
      this.siteUrl = !!(config.siteUrl);

      if (config.media) {
        // Fetch the media directory to display its contents
        this.mediaDirectoryPath = config.media;
        const match = new RegExp(`^${this.mediaDirectoryPath}`);

        this.media = this.collection.filter((m) => {
          const path = m.get('path');

          return m.get('type') === 'file' && match.test(path)
            && (util.isBinary(path) || util.isImage(m.get('extension')));
        });
      }

      if (config.relativeLinks) {
        $.ajax({
          cache: true,
          dataType: 'jsonp',
          jsonp: false,
          jsonpCallback: config.relativeLinks.split('?callback=')[1] || 'callback',
          url: config.relativeLinks,
          success(links) {
            self.relativeLinks = links;
          },
        });
      }
    }
  }

  fileInput = (e) => {
    const view = this;
    upload.fileSelect(e, (e, file, content) => {
      view.trigger('updateImageInsert', e, file, content);
    });

    return false;
  }

  highlight(type) {
    this.$el.find('.group a').removeClass('active');
    if (arguments) this.$el.find(`[data-key="${type}"]`).addClass('active');
  }

  post = (e) => {
    if (e) e.preventDefault();
    this.trigger('post', e);
  }

  markdownSnippet = (e) => {
    const self = this;
    const $target = $(e.target).closest('a');
    const $dialog = this.$el.find('#dialog');
    const $snippets = this.$el.find('.group a');
    const key = $target.data('key');
    const snippet = $target.data('snippet');
    const selection = util.trim(this.view.editor.getSelection());

    $dialog.removeClass().empty();

    if (snippet) {
      $snippets.removeClass('on');

      if (selection) {
        switch (key) {
          case 'bold':
            this.bold(selection);
            break;
          case 'italic':
            this.italic(selection);
            break;
          case 'heading':
            this.heading(selection);
            break;
          case 'sub-heading':
            this.subHeading(selection);
            break;
          case 'quote':
            this.quote(selection);
            break;
          case 'list':
            this.list(selection);
            break;
          case 'numbered-list':
            this.numberedList(selection);
            break;
          default:
            this.view.editor.replaceSelection(snippet);
            break;
        }
        this.view.editor.focus();
      } else {
        this.view.editor.replaceSelection(snippet);
        this.view.editor.focus();
      }
    } else if ($target.data('dialog')) {
      let tmpl; let
        className;
      if (key === 'media' && !this.mediaDirectoryPath
          || key === 'media' && !this.media.length) {
        className = `${key} no-directory`;
      } else {
        className = key;
      }

      // This condition handles the link and media link in the toolbar.
      if ($target.hasClass('on')) {
        $target.removeClass('on');
        $dialog.removeClass().empty();
      } else {
        $snippets.removeClass('on');
        $target.addClass('on');
        $dialog
          .removeClass()
          .addClass(`dialog ${className}`)
          .empty();

        switch (key) {
          case 'link':
            tmpl = template(templates.dialogs.link);

            $dialog.append(tmpl({
              relativeLinks: self.relativeLinks,
            }));

            if (self.relativeLinks) {
              $('.chzn-select', $dialog).chosen().change(function () {
                $('.chzn-single span').text('Insert a local link.');

                const parts = $(this).val().split(',');
                $('input[name=href]', $dialog).val(parts[0]);
                $('input[name=text]', $dialog).val(parts[1]);
              });
            }

            if (selection) {
            // test if this is a markdown link: [text](link)
              const link = /\[([^\]]+)\]\(([^)]+)\)/;
              const quoted = /".*?"/;

              let text = selection;
              let href;
              let title;

              if (link.test(selection)) {
                const parts = link.exec(selection);
                text = parts[1];
                href = parts[2];

                // Search for a title attrbute within the url string
                if (quoted.test(parts[2])) {
                  href = parts[2].split(quoted)[0];

                  // TODO: could be improved
                  title = parts[2].match(quoted)[0].replace(/"/g, '');
                }
              }

              $('input[name=text]', $dialog).val(text);
              if (href) $('input[name=href]', $dialog).val(href);
              if (title) $('input[name=title]', $dialog).val(title);
            }
            break;
          case 'media':
            tmpl = template(templates.dialogs.media);
            $dialog.append(tmpl({
              description: t('dialogs.media.description', {
                input: '<input id="upload" class="upload" type="file" />',
              }),
              assetsDirectory: !!((self.media && self.media.length)),
              writable: self.file.get('writable'),
            }));

            if (self.media && self.media.length) self.renderMedia(self.media);

            if (selection) {
              const image = /!\[([^[]*)\]\(([^)]+)\)/;
              let src;
              let alt;

              if (image.test(selection)) {
                const imageParts = image.exec(selection);
                alt = imageParts[1];
                src = imageParts[2];

                $('input[name=url]', $dialog).val(src);
                if (alt) $('input[name=alt]', $dialog).val(alt);
              }
            }
            break;
          case 'help':
          // tmpl = _(templates.dialogs.help).template();
            tmpl = template(templates.dialogs.help);
            $dialog.append(tmpl({
              help: toolbar().help,
            }));

            // Page through different help sections
            var $mainMenu = this.$el.find('.main-menu a');
            var $subMenu = this.$el.find('.sub-menu');
            var $content = this.$el.find('.help-content');

            $mainMenu.on('click', function () {
              if (!$(this).hasClass('active')) {
                $mainMenu.removeClass('active');
                $content.removeClass('active');
                $subMenu
                  .removeClass('active')
                  .find('a')
                  .removeClass('active');

                $(this).addClass('active');

                // Add the relavent sub menu
                const parent = $(this).data('id');
                $(`.${parent}`).addClass('active');

                // Add an active class and populate the
                // content of the first list item.
                const $firstSubElement = $(`.${parent} a:first`, this.el);
                $firstSubElement.addClass('active');

                const subParent = $firstSubElement.data('id');
                $(`.help-${subParent}`).addClass('active');
              }
              return false;
            });

            $subMenu.find('a').on('click', function () {
              if (!$(this).hasClass('active')) {
                $subMenu.find('a').removeClass('active');
                $content.removeClass('active');
                $(this).addClass('active');

                // Add the relavent content section
                const parent = $(this).data('id');
                $(`.help-${parent}`).addClass('active');
              }

              return false;
            });

            break;
          default:
        }
      }
    }

    return false;
  }

  publishState = () => {
    if (this.$el.find('publish-state') === 'true') {
      return true;
    }
    return false;
  }

  updatePublishState = () => {
    // Update the publish key wording depening on what was saved
    const $publishKey = this.$el.find('.publish-flag');
    const key = $publishKey.attr('data-state');

    if (key === 'true') {
      $publishKey.html(`${t('actions.publishing.published')
      }<span class="ico small checkmark"></span>`);
    } else {
      $publishKey.html(`${t('actions.publishing.unpublished')
      }<span class="ico small checkmark"></span>`);
    }
  }

  togglePublishing = (e) => {
    const $target = $(e.currentTarget);
    const metadata = this.file.get('metadata');
    const { published } = metadata;

    // TODO: remove HTML from view
    // Toggling publish state when the current file is published live
    if (published) {
      if ($target.hasClass('published')) {
        $target
          .empty()
          .append(`${t('actions.publishing.unpublish')
          }<span class="ico small checkmark"></span>`
                + `<span class="popup round arrow-top">${
                  t('actions.publishing.unpublishInfo')
                }</span>`)
          .removeClass('published')
          .attr('data-state', false);
      } else {
        $target
          .empty()
          .append(`${t('actions.publishing.published')
          }<span class="ico small checkmark"></span>`)
          .addClass('published')
          .attr('data-state', true);
      }
    } else if ($target.hasClass('published')) {
      $target
        .empty()
        .append(`${t('actions.publishing.unpublished')
        }<span class="ico small checkmark"></span>`)
        .removeClass('published')
        .attr('data-state', false);
    } else {
      $target
        .empty()
        .append(`${t('actions.publishing.publish')
        }<span class="ico small checkmark"></span>`
                + `<span class="popup round arrow-top">${
                  t('actions.publishing.publishInfo')
                }</span>`)
        .addClass('published')
        .attr('data-state', true);
    }

    this.file.set('metadata', extend(metadata, {
      published: !published,
    }));

    this.view.makeDirty();
    return false;
  }

  dialogInsert = (e) => {
    // var $dialog = $('#dialog', this.el);
    const $target = $(e.target, this.el);
    const type = $target.data('type');

    if (type === 'link') {
      const href = $('input[name="href"]').val();
      let text = $('input[name="text"]').val();
      const title = $('input[name="title"]').val();

      if (!text) text = href;

      if (title) {
        this.view.editor.replaceSelection(`[${text}](${href} "${title}")`);
      } else {
        this.view.editor.replaceSelection(`[${text}](${href})`);
      }

      this.view.editor.focus();
    }

    if (type === 'media') {
      if (this.queue) {
        const userDefinedPath = $('input[name="url"]').val();
        this.view.upload(this.queue.e, this.queue.file, this.queue.content, userDefinedPath);

        // Finally, clear the queue object
        this.queue = undefined;
      } else {
        const src = `{{site.baseurl}}/${$('input[name="url"]').val()}`;
        const alt = $('input[name="alt"]').val();
        this.view.editor.replaceSelection(`![${alt}](${src})`);
        this.view.editor.focus();
      }
    }

    return false;
  }

  heading = (s) => {
    if (s.charAt(0) === '#' && s.charAt(2) !== '#') {
      this.view.editor.replaceSelection(util.lTrim(s.replace(/#/g, '')));
    } else {
      this.view.editor.replaceSelection(`## ${s.replace(/#/g, '')}`);
    }
  }

  subHeading = (s) => {
    if (s.charAt(0) === '#' && s.charAt(3) !== '#') {
      this.view.editor.replaceSelection(util.lTrim(s.replace(/#/g, '')));
    } else {
      this.view.editor.replaceSelection(`### ${s.replace(/#/g, '')}`);
    }
  }

  italic = (s) => {
    if (s.charAt(0) === '_' && s.charAt(s.length - 1 === '_')) {
      this.view.editor.replaceSelection(s.replace(/_/g, ''));
    } else {
      this.view.editor.replaceSelection(`_${s.replace(/_/g, '')}_`);
    }
  }

  bold = (s) => {
    if (s.charAt(0) === '*' && s.charAt(s.length - 1 === '*')) {
      this.view.editor.replaceSelection(s.replace(/\*/g, ''));
    } else {
      this.view.editor.replaceSelection(`**${s.replace(/\*/g, '')}**`);
    }
  }

  quote = (s) => {
    if (s.charAt(0) === '>') {
      this.view.editor.replaceSelection(util.lTrim(s.replace(/>/g, '')));
    } else {
      this.view.editor.replaceSelection(`> ${s.replace(/>/g, '')}`);
    }
  }

  list = (s) => {
    if (/^[-+]/.test(s.charAt(0))) {
      this.view.editor.replaceSelection(util.lTrim(s.replace(/^[-+]\s?/gm, '').replace(/$/gm, '\r')));
    } else if (s.substring(0, 3) === '* *') {
      this.view.editor.replaceSelection(util.lTrim(s.replace(/^\*\s?/gm, '').replace(/$/gm, '\r')));
    } else {
      this.view.editor.replaceSelection(util.lTrim(s.replace(/^[-+]\s?|^\d*\.\s?|^/gm, '- ').replace(/$/gm, '\r')));
    }
  }

  numberedList = (s) => {
    if (/^\d/.test(s.charAt(0))) {
      this.view.editor.replaceSelection(util.lTrim(s.replace(/^\d*\.\s?/gm, '').replace(/$/gm, '\r')));
    } else if (s.substring(0, 3) === '* *') {
      this.view.editor.replaceSelection(util.lTrim(s.replace(/^\*\s?/gm, '').replace(/$/gm, '\r')));
    } else {
      this.view.editor.replaceSelection(util.lTrim(s.replace(/^\d*\.\s?|^[-+]\s?|^/gm, '1. ').replace(/$/gm, '\r')));
    }
  }

  renderMedia(data, back) {
    const self = this;
    const $media = this.$el.find('#media');
    // var tmpl = _(templates.dialogs.mediadirectory).template();
    const tmpl = template(templates.dialogs.mediadirectory);

    // Reset some stuff
    $media.empty();

    if (back && (back.join() !== this.assetsDirectory)) {
      const link = back.slice(0, back.length - 1).join('/');
      $media.append(`<li class="directory back"><a href="${link}"><span class="ico fl small inline back"></span>Back</a></li>`);
    }

    data.forEach((d) => {
      const parts = d.get('path').split('/');
      const path = parts.slice(0, parts.length - 1).join('/');

      $media.append(tmpl({
        name: d.get('name'),
        type: d.get('type'),
        path: `${path}/${encodeURIComponent(d.get('name'))}`,
        isMedia: util.isMedia(d.get('name').split('.').pop()),
      }));
    });

    $('.asset a', $media).on('click', function () {
      const href = $(this).attr('href');
      const alt = util.trim($(this).text());

      if (util.isImage(href.split('.').pop())) {
        self.$el.find('input[name="url"]').val(href);
        self.$el.find('input[name="alt"]').val(alt);
      } else {
        self.view.editor.replaceSelection(href);
        self.view.editor.focus();
      }
      return false;
    });
  }

  render() {
    const toolbar = {
      markdown: this.file.get('markdown'),
      writable: this.file.get('writable'),
      lang: this.file.get('lang'),
      draft: this.file.get('draft'),
      metadata: this.file.get('metadata'),
    };

    this.$el.html(template(this.template, { variable: 'toolbar' })(toolbar));

    return this;
  }
}
