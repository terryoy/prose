import React from 'react';
import { Link } from 'react-router-dom';

import { RoutePaths } from 'scripts/router/constants';
import { I18nContext } from 'scripts/ui/providers/i18n';

import "./prose_menu.scss";

export const ProseMenu = () => {
  const i18n = React.useContext(I18nContext);
  const isRTL = i18n.isRTL();
  const dir = isRTL ? 'rtl' : null;

  const dropdownLinks = [
    {
      path: RoutePaths.ROOT,
      label: 'Prose',
    },
    {
      className: 'about',
      path: RoutePaths.ABOUT,
      label: i18n.t('navigation.about')
    },
    {
      className: 'help',
      href: 'https://github.com/terryoy/prose',
      label: i18n.t('navigation.develop'),
    },
    {
      path: RoutePaths.CHOOSE_LANGUAGE,
      label: i18n.t('navigation.language'),
    }
  ]

  return (
    <div className='prose-menu dropdown-menu' dir={dir}>
      <div className='inner clearfix'>
        <a href='#' className='icon branding dropdown-hover' data-link>
          Prose
        </a>
        <ul className='dropdown clearfix'>
          {
            dropdownLinks.map((item) => (
              <li key={item.label}>
                {
                  item.href ?
                    <a className={item.className} href={item.href}>{item.label}</a> :
                    <Link className={item.className} to={item.path}>{item.label}</Link>
                }

              </li>
            ))
          }
          <li className='divider authenticated'></li>
          <li className='authenticated'>
            <a href='#' className='logout'>
              {i18n.t('navigation.logout')}
            </a>
          </li>
        </ul>
      </div>
    </div>
  )
}
