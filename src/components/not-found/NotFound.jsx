import React from 'react';
import './NotFound.css';

const NotFound = () => {
  return (
    <div className="not-found">
      <img src="https://www.altinbas.com/images/404.jpg" alt="404 Error" className="not-found__image" />
      <h1 className="not-found__title">Oops! Page Not Found</h1>
      <p className="not-found__description">We're sorry, but the page you requested could not be found.</p>
      <a href="/" className="not-found__button">Go to Home</a>
    </div>
  );
};

export default NotFound;
