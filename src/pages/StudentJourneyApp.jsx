import { useEffect, useState } from 'react';
import OnboardingPage from './OnboardingPage';
import LoginPage from './LoginPage';
import StudentArea from './student/StudentArea';
import TeacherArea from './teacher/TeacherArea';
import {
  api,
  STORAGE_KEYS,
  getStoredRole,
  getStoredToken,
  saveAuthSession,
  clearAuthSession,
  getStoredSchoolId,
} from '../services/apiClient';

function getInitialTheme() {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const storedTheme = window.localStorage.getItem(STORAGE_KEYS.theme);
  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme;
  }

  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  return 'light';
}

function getInitialLoggedIn() {
  return Boolean(getStoredToken());
}

function getInitialRole() {
  return getStoredRole();
}

function getInitialSchoolName() {
  if (typeof window === 'undefined') {
    return '';
  }
  return window.localStorage.getItem(STORAGE_KEYS.schoolName) || '';
}

function mapSchoolsToOptions(schools) {
  if (!Array.isArray(schools)) {
    return [];
  }
  return schools.map((school) => ({
    id: String(school.id),
    name: school.name,
  }));
}

async function loadSchoolsForToken(token) {
  const meResponse = await api.meWithToken(token).catch(() => null);
  const schoolsFromMe = mapSchoolsToOptions(meResponse?.schools);
  if (schoolsFromMe.length > 0) {
    return { schools: schoolsFromMe, user: meResponse?.user || null };
  }

  const schoolsResponse = await api.schoolsWithToken(token).catch(() => null);
  const schoolsFromList = mapSchoolsToOptions(schoolsResponse);
  return { schools: schoolsFromList, user: meResponse?.user || null };
}

function StudentJourneyApp() {
  const [theme, setTheme] = useState(getInitialTheme);
  const [loggedIn, setLoggedIn] = useState(getInitialLoggedIn);
  const [authStep, setAuthStep] = useState('onboarding');
  const [selectedRole, setSelectedRole] = useState(getInitialRole);
  const [authForm, setAuthForm] = useState({ email: '', password: '' });
  const [selectedSchoolId, setSelectedSchoolId] = useState(() => getStoredSchoolId() || '');
  const [selectedSchoolName, setSelectedSchoolName] = useState(getInitialSchoolName);
  const [schoolOptions, setSchoolOptions] = useState([]);
  const [teacherSchoolSelectionRequired, setTeacherSchoolSelectionRequired] = useState(false);
  const [pendingTeacherSession, setPendingTeacherSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [schoolsLoading, setSchoolsLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [bootstrapChecked, setBootstrapChecked] = useState(false);

  const applyRoleFromUser = (user) => {
    const roles = user?.roles || [];
    if (roles.includes('teacher') || roles.includes('admin')) {
      setSelectedRole('teacher');
      return 'teacher';
    }
    setSelectedRole('student');
    return 'student';
  };

  const finalizeLogin = (sessionPayload) => {
    saveAuthSession(sessionPayload);
    applyRoleFromUser(sessionPayload?.user);
    if (sessionPayload?.school?.id) {
      setSelectedSchoolId(String(sessionPayload.school.id));
    } else {
      setSelectedSchoolId('');
    }
    if (sessionPayload?.school?.name) {
      setSelectedSchoolName(sessionPayload.school.name);
    } else {
      setSelectedSchoolName('');
    }
    setTeacherSchoolSelectionRequired(false);
    setPendingTeacherSession(null);
    setLoggedIn(true);
  };

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(STORAGE_KEYS.theme, theme);
  }, [theme]);

  useEffect(() => {
    if (!loggedIn) {
      setBootstrapChecked(true);
      return;
    }

    let isMounted = true;
    api
      .me()
      .then((response) => {
        if (!isMounted) {
          return;
        }
        const roles = response?.user?.roles || [];
        if (roles.includes('teacher') || roles.includes('admin')) {
          setSelectedRole('teacher');
        } else if (roles.includes('student')) {
          setSelectedRole('student');
        }

        if (Array.isArray(response?.schools) && response.schools.length > 0) {
          const options = mapSchoolsToOptions(response.schools);
          setSchoolOptions(options);
          const storedSchoolId = getStoredSchoolId();
          const activeSchool =
            options.find((option) => option.id === storedSchoolId) || options[0];
          setSelectedSchoolId(activeSchool.id);
          setSelectedSchoolName(activeSchool.name);
        }
      })
      .catch(() => {
        clearAuthSession();
        if (isMounted) {
          setLoggedIn(false);
        }
      })
      .finally(() => {
        if (isMounted) {
          setBootstrapChecked(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [loggedIn]);

  useEffect(() => {
    if (loggedIn) {
      return;
    }

    if (selectedRole !== 'teacher') {
      setSchoolsLoading(false);
      setSchoolOptions([]);
      setSelectedSchoolId('');
      setSelectedSchoolName('');
      setTeacherSchoolSelectionRequired(false);
      setPendingTeacherSession(null);
      return;
    }

    if (authStep !== 'login' || teacherSchoolSelectionRequired) {
      return;
    }

    let isMounted = true;
    setSchoolsLoading(true);

    api
      .schoolsForLogin()
      .then((response) => {
        if (!isMounted) {
          return;
        }

        const options = mapSchoolsToOptions(response);
        setSchoolOptions(options);

        if (options.length === 0) {
          setSelectedSchoolId('');
          setSelectedSchoolName('');
          return;
        }

        const storedSchoolId = getStoredSchoolId();
        const activeSchool =
          options.find((option) => option.id === storedSchoolId) || options[0];
        setSelectedSchoolId(activeSchool.id);
        setSelectedSchoolName(activeSchool.name);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }
        setSchoolOptions([]);
        setSelectedSchoolId('');
        setSelectedSchoolName('');
      })
      .finally(() => {
        if (isMounted) {
          setSchoolsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [loggedIn, selectedRole, authStep, teacherSchoolSelectionRequired]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    if (selectedSchoolId) {
      window.localStorage.setItem(STORAGE_KEYS.schoolId, selectedSchoolId);
    }
    if (selectedSchoolName) {
      window.localStorage.setItem(STORAGE_KEYS.schoolName, selectedSchoolName);
    }
  }, [selectedSchoolId, selectedSchoolName]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(STORAGE_KEYS.role, selectedRole);
  }, [selectedRole]);

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === 'light' ? 'dark' : 'light'));
  };

  const handleAuthSubmit = async () => {
    setAuthError('');
    setAuthLoading(true);
    try {
      if (teacherSchoolSelectionRequired) {
        const selectedSchool = schoolOptions.find((option) => option.id === selectedSchoolId);
        if (!selectedSchool || !pendingTeacherSession) {
          setAuthError('Одбери училиште за да продолжиш.');
          return;
        }
        finalizeLogin({
          token: pendingTeacherSession.token,
          user: pendingTeacherSession.user,
          school: { id: Number(selectedSchool.id), name: selectedSchool.name },
        });
        return;
      }

      const payload = {
        email: authForm.email,
        password: authForm.password,
      };
      if (selectedRole === 'teacher' && selectedSchoolId) {
        payload.school_id = Number(selectedSchoolId);
      }

      const response = await api.login(payload);
      const { schools: loadedSchools, user: meUser } = await loadSchoolsForToken(response.token);
      const resolvedUser = meUser || response?.user;
      const resolvedRole = applyRoleFromUser(resolvedUser);
      const initialSchool = response?.school
        ? { id: String(response.school.id), name: response.school.name }
        : null;
      const options =
        loadedSchools.length > 0
          ? loadedSchools
          : initialSchool
            ? [initialSchool]
            : [];
      setSchoolOptions(options);

      if (resolvedRole === 'teacher') {
        if (options.length === 0) {
          setAuthError('Не може да се вчитаат училишта за наставничкиот профил.');
          return;
        }
        if (options.length > 1 && !payload.school_id) {
          const activeSchool = options.find((option) => option.id === initialSchool?.id) || options[0];
          setSelectedSchoolId(activeSchool.id);
          setSelectedSchoolName(activeSchool.name);
          setPendingTeacherSession({
            token: response.token,
            user: resolvedUser,
          });
          setTeacherSchoolSelectionRequired(true);
          return;
        }

        const singleSchool =
          options.find((option) => option.id === String(payload.school_id)) ||
          options.find((option) => option.id === initialSchool?.id) ||
          options[0] ||
          initialSchool;
        finalizeLogin({
          token: response.token,
          user: resolvedUser,
          school: singleSchool
            ? { id: Number(singleSchool.id), name: singleSchool.name }
            : response?.school,
        });
        return;
      }

      const fallbackSchool =
        response?.school ||
        (options[0] ? { id: Number(options[0].id), name: options[0].name } : null);
      finalizeLogin({
        token: response.token,
        user: resolvedUser,
        school: fallbackSchool,
      });
    } catch (error) {
      setAuthError(error.message || 'Најавата не успеа.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    api.logout().catch(() => null);
    clearAuthSession();
    setLoggedIn(false);
    setAuthStep('onboarding');
    setAuthForm({ email: '', password: '' });
    setTeacherSchoolSelectionRequired(false);
    setPendingTeacherSession(null);
    setSchoolsLoading(false);
    setSchoolOptions([]);
  };

  if (loggedIn && !bootstrapChecked) {
    return (
      <main className={`auth-root theme-${theme}`}>
        <section className="auth-card">
          <p className="auth-eyebrow">Се вчитува сесијата...</p>
        </section>
      </main>
    );
  }

  if (!loggedIn) {
    if (authStep === 'onboarding') {
      return (
        <OnboardingPage
          theme={theme}
          selectedRole={selectedRole}
          onSelectRole={setSelectedRole}
          onContinue={() => setAuthStep('login')}
        />
      );
    }

    return (
      <LoginPage
        theme={theme}
        role={selectedRole}
        email={authForm.email}
        password={authForm.password}
        selectedSchoolId={selectedSchoolId}
        schoolOptions={schoolOptions}
        showSchoolSelector={
          selectedRole === 'teacher' &&
          (teacherSchoolSelectionRequired
            ? schoolOptions.length > 1
            : schoolOptions.length > 0)
        }
        schoolSelectionOnly={teacherSchoolSelectionRequired}
        schoolSelectionMessage={
          selectedRole === 'teacher'
            ? teacherSchoolSelectionRequired
              ? 'Избери училиште за наставничката сесија.'
              : schoolsLoading
                ? 'Се вчитуваат училишта...'
                : schoolOptions.length > 0
                  ? 'Избери училиште пред најава.'
                  : 'Нема вчитани училишта. Може да се најавиш и без избор.'
            : ''
        }
        onEmailChange={(email) =>
          setAuthForm((previous) => ({ ...previous, email }))
        }
        onPasswordChange={(password) =>
          setAuthForm((previous) => ({ ...previous, password }))
        }
        onSelectSchool={(schoolId) => {
          setSelectedSchoolId(schoolId);
          const chosen = schoolOptions.find((option) => option.id === schoolId);
          if (chosen) {
            setSelectedSchoolName(chosen.name);
          }
        }}
        onSubmit={() => void handleAuthSubmit()}
        onBack={() => {
          setAuthStep('onboarding');
          setAuthError('');
          setTeacherSchoolSelectionRequired(false);
          setPendingTeacherSession(null);
          setSchoolsLoading(false);
          setSchoolOptions([]);
        }}
        loading={authLoading}
        error={authError}
        submitText={teacherSchoolSelectionRequired ? 'Продолжи' : 'Најава'}
      />
    );
  }

  if (selectedRole === 'teacher') {
    return (
      <TeacherArea
        theme={theme}
        onToggleTheme={toggleTheme}
        onLogout={handleLogout}
        schoolId={selectedSchoolId}
        school={selectedSchoolName}
      />
    );
  }

  return (
    <StudentArea
      theme={theme}
      onToggleTheme={toggleTheme}
      onLogout={handleLogout}
    />
  );
}

export default StudentJourneyApp;
