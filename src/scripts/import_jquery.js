
// import jquery from 'jquery';

export const importJquery = () => {
  return Promise.resolve(null)
    .then(() => {
      var jquery = require('jquery');
      window.$ = window.jQuery = jquery; // notice the definition of global variables here
    })
    .then(() => {
      require('chosen-js');
    });
};

// import 'chosen-js';

// export default (window.$ = window.jQuery = jquery);
