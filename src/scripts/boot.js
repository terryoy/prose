import { I18n } from './translations/i18n';
import { Config } from './config';

// process authentication before starting the app
const authenticate = async (config) => {
  await 0;
};

export const init = async (config) => {
  await I18n.initLanguage();
  await authenticate(config);
};

init(Config)
  .then(() => import('./app')
    .then(({ mountApp }) => {
      const node = document.querySelector('#prose');
      mountApp(node);
    }));
