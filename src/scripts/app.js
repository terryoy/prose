import React from 'react';
import ReactDOM from 'react-dom';

import { App } from 'scripts/ui/views/app';

import "styles/_responsive.scss";
import "styles/app/icon.scss";

export const mountApp = (node) => {
  // react
  ReactDOM.render(<App />, node);
};
