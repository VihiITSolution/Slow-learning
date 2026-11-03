import React from 'react';
import RoleRoute from './RoleRoute';

/** Any logged-in user (kept for compatibility - prefer <RoleRoute roles={[...]}>). */
const PrivateRoute = ({ children }) => <RoleRoute>{children}</RoleRoute>;

export default PrivateRoute;
