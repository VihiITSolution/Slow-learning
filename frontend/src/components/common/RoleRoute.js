/**
 * Role-aware routing helpers.
 *
 * - homeFor(user): where a user belongs (student / teacher / admin area)
 * - <RoleRoute roles={[...]}>: logged-out users go to /login (and come back
 *   afterwards); logged-in users without the role go to their own home
 * - <HomeRedirect />: "/" sends logged-in users to their home, everyone
 *   else to the public Learning Helper start page
 * - <GuestOnly />: login/register pages send logged-in users home
 */
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const homeFor = (user) => {
  if (user?.role === 'admin') return '/admin/dashboard';
  if (user?.role === 'teacher') return '/teacher/dashboard';
  return '/app/dashboard';
};

// Where each area of the app lives, so a redirect target can be checked
const AREA_ROLES = [
  ['/admin', ['admin']],
  ['/teacher', ['teacher', 'admin']],
  ['/student-selection', ['teacher', 'admin']],
  ['/learning-assessment', ['teacher', 'admin']],
  ['/app', ['student']],
];

/** True when `user` may open `path` (used to honour "go back to where you were"). */
export const canOpen = (user, path) => {
  if (!path) return false;
  const area = AREA_ROLES.find(([prefix]) => path === prefix || path.startsWith(`${prefix}/`));
  return !area || area[1].includes(user?.role);
};

export default function RoleRoute({ roles, children }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (roles && !roles.includes(user?.role)) {
    return <Navigate to={homeFor(user)} replace />;
  }
  return children;
}

export function HomeRedirect() {
  const { user, isAuthenticated } = useAuth();
  return <Navigate to={isAuthenticated ? homeFor(user) : '/learning-helper'} replace />;
}

export function GuestOnly({ children }) {
  const { user, isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to={homeFor(user)} replace /> : children;
}
