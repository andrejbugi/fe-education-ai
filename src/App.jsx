import StudentJourneyApp from './pages/StudentJourneyApp';
import AdminApp from './pages/admin/AdminApp';
import './styles.css';

function isAdminPath(pathname) {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

function App() {
  const pathname = typeof window === 'undefined' ? '/' : window.location.pathname;

  return isAdminPath(pathname) ? <AdminApp /> : <StudentJourneyApp />;
}

export default App;
