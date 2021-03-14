import React from 'react';

import { I18n } from 'scripts/translations/i18n';

export const I18nContext = React.createContext({});



/*
  HOC to add i18n context
 */
export const addI18nContext = (Component) => {
  return (props) => {
    const i18nContext = I18n;

    return (
      <I18nContext.Provider value={i18nContext}>
        <Component {...props} />
      </I18nContext.Provider>
    )
  }
}
