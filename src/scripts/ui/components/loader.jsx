import React from 'react';

import "./loader.scss";

/*
  use a context to manage loader view status
 */
export const LoaderContext = React.createContext();

/*
  Loader view content
 */
export const Loader = () => {
  const {
    loading,
    message,
  } = React.useContext(LoaderContext);

  // decide whether to show loading
  const loadingStyle = loading.status ? {} : { display: 'none' };

  return (
    <div id='loader' className='loader' style={loadingStyle}>
      <div className="loading round clearfix">
        <div className="loading-icon" />
        <span className="message">
          { message.value }
        </span>
      </div>
    </div>
  );
};

/*
  HOC to add loaderview context
 */
export const addLoaderContext = (Component) => {
  return (props) => {
    const [loading, setLoading] = React.useState(false);
    const [message, setMessage] = React.useState('');

    const loader = {
      loading: { status: loading, set: setLoading },
      message: { value: message, set: setMessage },
    };

    return (
      <LoaderContext.Provider value={loader}>
        <Component {...props} />
      </LoaderContext.Provider>
    );
  }
};
