import React from "react";

// Question: Write a Higher-Order Component (HOC) called withAuthentication
// that wraps a component and provides an isAuthenticated prop indicating whether
//  the user is authenticated or not. Assume there’s an authenticate function that
// returns a boolean value.

export const WithAuthentication = (WrappingComponent) => {
  return <WrappingComponent {...props} isAuthed="true" />;
};
