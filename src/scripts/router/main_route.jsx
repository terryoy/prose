import React from 'react';
import {
  Switch, Route,
} from 'react-router-dom';

import { AboutView } from 'scripts/ui/views/about';
import { ChooseLanguageView } from 'scripts/ui/views/choose_language';
import { UserProfileView } from 'scripts/ui/views/user_profile';
import { UserRepoView } from 'scripts/ui/views/user_repo';

import { RoutePaths } from './constants';

export const MainRoute = () => (
  <Switch>

    {/* Common views */}
    <Route path={RoutePaths.ABOUT} component={AboutView} />
    <Route path={RoutePaths.CHOOSE_LANGUAGE} component={ChooseLanguageView} />

    {/* User views */}
    <Route path={RoutePaths.USER_REPO_PATH} component={UserRepoView} />
    <Route path={RoutePaths.USER_REPO} component={UserRepoView} />
    <Route path={RoutePaths.USER_PROFILE} component={UserProfileView} />

  </Switch>
);
