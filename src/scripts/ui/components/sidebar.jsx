import React from 'react';

import {
  I18nContext
} from 'scripts/ui/providers/i18n';

export const Sidebar = () => {
  const i18n = React.useContext(I18nContext);
  const isRTL = i18n.isRTL();
  const dir = isRTL ? 'rtl' : null;

  return (
    <div id='drawer' className='sidebar' dir={dir}>
      {/* Sidebar Content*/}


    </div>
  )
}
