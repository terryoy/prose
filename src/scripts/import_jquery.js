// import jquery from 'jquery';

export const importJquery = () => import('jquery')
  .then((jquery) => {
    // eslint-disable-next-line no-multi-assign
    window.$ = window.jQuery = jquery; // notice the definition of global variables here
  })
  .then(() => import('chosen-js'));

// import 'chosen-js';

// export default (window.$ = window.jQuery = jquery);
