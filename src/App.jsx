import StudentJourneyApp from './pages/StudentJourneyApp';
import AdminApp from './pages/admin/AdminApp';
import InvitationAcceptPage from './pages/InvitationAcceptPage';
import './styles.css';

function isAdminPath(pathname) {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

function getInvitationToken(pathname) {
  const match = String(pathname || '').match(/^\/invitations\/([^/]+)$/);
  return match ? decodeURIComponent(match[1]) : '';
}

function App() {
  const pathname = typeof window === 'undefined' ? '/' : window.location.pathname;
  const invitationToken = getInvitationToken(pathname);

  if (invitationToken) {
    return <InvitationAcceptPage token={invitationToken} />;
  }

  return isAdminPath(pathname) ? <AdminApp /> : <StudentJourneyApp />;
}

export default App;
