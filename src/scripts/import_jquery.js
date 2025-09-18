import jquery from 'jquery';

export const importJquery = () => {
  // eslint-disable-next-line no-multi-assign
  window.$ = window.jQuery = jquery;
  // Defer requiring chosen until jQuery is available globally.
  // eslint-disable-next-line global-require
  require('chosen-js');
  return Promise.resolve(jquery);
};
