import React from 'react';

import { LoaderContext } from 'scripts/ui/components/loader';
/*
  Authentication Flow
 */
export const AuthFlowProvider = () => {
  const [isAuthed, setIsAuthed] = React.useState(false);
  const loaderContext = React.useContext(LoaderContext);

  // set app loading
  React.useEffect(() => {
    if (!isAuthed) {
      loaderContext.loading.set(true);

      // start auth
      setTimeout(() => {
        setIsAuthed(true);
        loaderContext.loading.set(false);
      }, 5000);
    }
  });

  return (
    <>
      {null}
    </>
  );
}
