import StudentJourneyApp from './pages/StudentJourneyApp';
import AdminApp from './pages/admin/AdminApp';
import InvitationAcceptPage from './pages/InvitationAcceptPage';
import PasswordResetRequestPage from './pages/PasswordResetRequestPage';
import PasswordResetConfirmPage from './pages/PasswordResetConfirmPage';
import './styles.css';

function isAdminPath(pathname) {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

function getInvitationToken(pathname) {
  const match = String(pathname || '').match(/^\/invitations\/([^/]+)$/);
  return match ? decodeURIComponent(match[1]) : '';
}

function isPasswordResetRequestPath(pathname) {
  return pathname === '/password-reset';
}

function getPasswordResetToken(pathname) {
  const match = String(pathname || '').match(/^\/password_resets\/([^/]+)$/);
  if (match) {
    return decodeURIComponent(match[1]);
  }

  const altMatch = String(pathname || '').match(/^\/password-resets\/([^/]+)$/);
  return altMatch ? decodeURIComponent(altMatch[1]) : '';
}

function App() {
  const pathname = typeof window === 'undefined' ? '/' : window.location.pathname;
  const invitationToken = getInvitationToken(pathname);
  const passwordResetToken = getPasswordResetToken(pathname);

  if (invitationToken) {
    return <InvitationAcceptPage token={invitationToken} />;
  }

  if (isPasswordResetRequestPath(pathname)) {
    return <PasswordResetRequestPage />;
  }

  if (passwordResetToken) {
    return <PasswordResetConfirmPage token={passwordResetToken} />;
  }

  return isAdminPath(pathname) ? <AdminApp /> : <StudentJourneyApp />;
}

export default App;
