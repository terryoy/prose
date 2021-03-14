import pathUtil from 'path';

import Backbone from 'backbone';
import { escape, template, extend } from 'lodash-es';
import { t } from '../translations';

import util from '../util';
import templates from '../templates';

export default class HeaderView extends Backbone.View {
  template = templates.header;

  events = {
    'focus input': 'checkPlaceholder',
    'change input[data-mode="path"]': 'updatePath',
    'change input[data-mode="title"]': 'updateTitle',
  }

  constructor(options) {
    super(options);

    this.user = options.user;
    this.repo = options.repo;
    this.file = options.file;
    this.input = options.input;
    this.title = options.title;
    this.placeholder = options.placeholder;
    this.alterable = options.alterable;
  }

  checkPlaceholder = (e) => {
    if (this.file.isNew()) {
      const $target = $(e.target, this.el);
      if (!$target.val()) {
        $target.val($target.attr('placeholder'));
      }
    }
  }

  updatePath = (e) => {
    const { value } = e.currentTarget;

    this.file.set('path', value);
    this.trigger('makeDirty');
    return false;
  }

  updateTitle = (e) => {
    if (e) e.preventDefault();

    // TODO: update metadata title here, don't rely on makeDi

    // Only update path on new files that are not cloned
    if (this.file.isNew() && !this.file.isClone()) {
      const { value } = e.currentTarget;

      const path = this.file.get('path');
      const parts = path.split('/');
      const name = parts.pop();

      // Preserve the date and the extension
      const date = util.extractDate(name);
      const extension = name.split('.').pop();

      const newPath = pathUtil.join.apply(null, parts.concat([`${date}-${util.stringToUrl(value)}.${extension}`]));

      this.file.set('path', newPath);
    }

    const metadata = this.file.get('metadata') || {};
    this.file.set('metadata', extend(metadata, {
      title: e.currentTarget.value,
    }));

    this.trigger('makeDirty');
  }

  inputGet() {
    return this.$el.find('.headerinput').val();
  }

  headerInputFocus() {
    this.$el.find('.headerinput').focus();
  }

  render() {
    const user = this.user ? this.user.get('login') : this.repo.get('owner').login;
    // var permissions = this.repo ? this.repo.get('permissions') : undefined;
    const isPrivate = !!(this.repo && this.repo.get('private'));
    let title = t('heading.explore');
    let avatar;
    let path = user;

    if (this.user) {
      avatar = `<img src="${this.user.get('avatar_url')}" width="40" height="40" alt="Avatar" />`;
    } else if (this.file) {
      // File View
      avatar = `<span class="ico round document ${this.file.get('lang')}"></span>`;
      title = this.file.get('path');
    } else {
      // Repo View
      const lock = (isPrivate) ? ' private' : '';

      title = this.repo.get('name');
      path = `${path}/${title}`;
      avatar = `<div class="avatar round"><span class="icon round repo${lock}"></span></div>`;
    }

    const data = {
      alterable: this.alterable,
      avatar,
      repo: this.repo ? this.repo.attributes : undefined,
      isPrivate,
      input: escape(this.input),
      path: escape(path),
      placeholder: this.placeholder,
      user,
      title: escape(title),
      mode: this.title ? 'title' : 'path',
      translate: this.file ? this.file.get('translate') : undefined,
    };

    this.$el.empty().append(template(this.template, {
      variable: 'data',
    })(data));

    return this;
  }
}
