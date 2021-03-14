import React from 'react';
import { flow } from 'lodash-es';
import { HashRouter as Router } from 'react-router-dom';

import { AuthFlowProvider } from 'scripts/ui/providers/auth';
import { MainRoute } from 'scripts/router/main_route';
import {
  addLoaderContext,
  LoaderContext,
  Loader
} from 'scripts/ui/components/loader';
import { Navigation } from 'scripts/ui/components/navigation';
import { ProseMenu } from 'scripts/ui/components/prose_menu';
import { Sidebar } from 'scripts/ui/components/sidebar';
import {
  I18nContext,
  addI18nContext
} from 'scripts/ui/providers/i18n';

/*
  App's root view Layout
 */
const AppView = () => {
  const i18n = React.useContext(I18nContext);
  const isRTL = i18n.isRTL();
  const dir = isRTL ? 'rtl' : null;

  return (
    <div className="app-view">

      {/* Try to authenticate and redirect to user profile view */}
      <AuthFlowProvider />

      {/* default loading */}
      <Loader />
      <Sidebar />
      <Navigation />

      {/* other routes */}
      <div id="main" >
        <MainRoute />
      </div>

      <ProseMenu />

    </div>
  );
}

const WrappedAppView = flow(
  addLoaderContext,
  addI18nContext
)(AppView);

/**
 * App's mount component
 */
export const App = () => (
  <Router>
    <WrappedAppView />
  </Router>
);
