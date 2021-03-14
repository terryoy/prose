import { importJquery } from './import_jquery';

import { Config } from './config';
import { init } from './boot';

import '../styles/style.scss';

importJquery()
  .then(() => {
    // initialize the app
    init(Config);
  });
