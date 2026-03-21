import { useEffect, useState } from 'react';
import FlashMessage from '../components/FlashMessage';
import OnboardingPage from './OnboardingPage';
import LoginPage from './LoginPage';
import StudentArea from './student/StudentArea';
import TeacherArea from './teacher/TeacherArea';
import {
  AUTH_UNAUTHORIZED_EVENT,
  api,
  STORAGE_KEYS,
  getStoredRole,
  saveAuthSession,
  clearAuthSession,
  getStoredSchoolId,
} from '../services/apiClient';

const DOCUMENT_THEME_COLORS = {
  light: '#e9f4ff',
  dark: '#111d2a',
};

function getInitialTheme() {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const storedTheme = window.localStorage.getItem(STORAGE_KEYS.theme);
  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme;
  }

  if (window.matchMedia?.('(prefers-color-scheme: dark)')?.matches) {
    return 'dark';
  }

  return 'light';
}

function getInitialLoggedIn() {
  if (typeof window === 'undefined') {
    return false;
  }

  return Boolean(
    window.localStorage.getItem(STORAGE_KEYS.loggedIn) ||
      window.localStorage.getItem(STORAGE_KEYS.user)
  );
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

async function loadSessionSchools() {
  const meResponse = await api.me().catch(() => null);
  const schoolsFromMe = mapSchoolsToOptions(meResponse?.schools);
  if (schoolsFromMe.length > 0) {
    return { schools: schoolsFromMe, user: meResponse?.user || null };
  }

  const schoolsResponse = await api.schools().catch(() => null);
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
  const [flash, setFlash] = useState(null);

  const showFlash = (message, type = 'success') => {
    setFlash({
      id: Date.now(),
      message,
      type,
    });
  };

  const getRoleFromUser = (user) => {
    const roles = user?.roles || [];
    if (roles.includes('teacher') || roles.includes('admin')) {
      return 'teacher';
    }
    return 'student';
  };

  const applyRoleFromUser = (user) => {
    const resolvedRole = getRoleFromUser(user);
    setSelectedRole(resolvedRole);
    return resolvedRole;
  };

  const resolveActiveSchool = (schools, preferredSchool) => {
    const preferredSchoolId = preferredSchool?.id ? String(preferredSchool.id) : '';
    const storedSchoolId = getStoredSchoolId();

    return (
      schools.find((option) => option.id === preferredSchoolId) ||
      schools.find((option) => option.id === storedSchoolId) ||
      schools[0] ||
      (preferredSchoolId
        ? {
            id: preferredSchoolId,
            name: preferredSchool?.name || '',
          }
        : null)
    );
  };

  const finalizeLogin = (sessionPayload, options = {}) => {
    const shouldShowSuccessFlash = options.showSuccessFlash !== false;
    saveAuthSession(sessionPayload);
    const resolvedRole = applyRoleFromUser(sessionPayload?.user);
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
    if (shouldShowSuccessFlash) {
      showFlash(
        resolvedRole === 'teacher'
          ? 'Успешно се најавивте како наставник.'
          : 'Успешно се најавивте.',
        'success'
      );
    }
  };

  useEffect(() => {
    if (!flash?.id) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setFlash(null);
    }, 3200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [flash]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(STORAGE_KEYS.theme, theme);
  }, [theme]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const backgroundColor = DOCUMENT_THEME_COLORS[theme] || DOCUMENT_THEME_COLORS.dark;
    document.documentElement.style.backgroundColor = backgroundColor;
    document.body.style.backgroundColor = backgroundColor;

    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', backgroundColor);
    }
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

        const normalizedSchools = mapSchoolsToOptions(response?.schools);
        const activeSchool = resolveActiveSchool(
          normalizedSchools,
          response?.current_school || response?.school
        );

        if (normalizedSchools.length > 0) {
          setSchoolOptions(normalizedSchools);
        }

        saveAuthSession({
          user: response?.user,
          school: activeSchool
            ? {
                id: Number(activeSchool.id),
                name: activeSchool.name,
              }
            : null,
        });
        setSelectedRole(getRoleFromUser(response?.user));
        if (activeSchool?.id) {
          setSelectedSchoolId(String(activeSchool.id));
        } else {
          setSelectedSchoolId('');
        }
        if (activeSchool?.name) {
          setSelectedSchoolName(activeSchool.name);
        } else {
          setSelectedSchoolName('');
        }
        setTeacherSchoolSelectionRequired(false);
        setPendingTeacherSession(null);
        setLoggedIn(true);
      })
      .catch(() => {
        clearAuthSession();
        if (isMounted) {
          setLoggedIn(false);
          setSchoolOptions([]);
          setSelectedSchoolId('');
          setSelectedSchoolName('');
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

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleUnauthorized = () => {
      clearAuthSession();
      setLoggedIn(false);
      setBootstrapChecked(true);
      setAuthStep('login');
      setTeacherSchoolSelectionRequired(false);
      setPendingTeacherSession(null);
      setSchoolOptions([]);
      setSelectedSchoolId('');
      setSelectedSchoolName('');
      showFlash('Сесијата е истечена. Најавете се повторно.', 'error');
    };

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => {
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    };
  }, []);

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === 'light' ? 'dark' : 'light'));
  };

  const handleAuthSubmit = async () => {
    setAuthError('');
    setAuthLoading(true);
    try {
      if (selectedRole === 'teacher' && !teacherSchoolSelectionRequired && !selectedSchoolId) {
        return;
      }

      if (teacherSchoolSelectionRequired) {
        const selectedSchool = schoolOptions.find((option) => option.id === selectedSchoolId);
        if (!selectedSchool || !pendingTeacherSession) {
          setAuthError('Одбери училиште за да продолжиш.');
          return;
        }
        finalizeLogin({
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
      const { schools: loadedSchools, user: meUser } = await loadSessionSchools();
      const resolvedUser = meUser || response?.user;
      const resolvedRole = getRoleFromUser(resolvedUser);
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

      if (resolvedRole !== selectedRole) {
        if (resolvedRole === 'teacher') {
          setAuthError('Овој профил е наставнички. Најави се преку формата за наставник и избери училиште.');
        } else {
          setAuthError('Овој профил е ученички. Најави се преку формата за ученик.');
        }
        setTeacherSchoolSelectionRequired(false);
        setPendingTeacherSession(null);
        return;
      }

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
    showFlash('Успешно се одјавивте.', 'success');
  };

  if (!bootstrapChecked) {
    return (
      <>
        <FlashMessage flash={flash} onDismiss={() => setFlash(null)} />
        <main className={`auth-root theme-${theme}`}>
          <section className="auth-card">
            <p className="auth-eyebrow">Се вчитува сесијата...</p>
          </section>
        </main>
      </>
    );
  }

  if (!loggedIn) {
    if (authStep === 'onboarding') {
      return (
        <>
          <FlashMessage flash={flash} onDismiss={() => setFlash(null)} />
          <OnboardingPage
            theme={theme}
            selectedRole={selectedRole}
            onSelectRole={setSelectedRole}
            onContinue={() => setAuthStep('login')}
          />
        </>
      );
    }

    return (
        <>
          <FlashMessage flash={flash} onDismiss={() => setFlash(null)} />
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
                      : 'Неуспешно вчитување училишта, Ве молиме освежете ја страната.'
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
            submitDisabled={
              selectedRole === 'teacher' && (!selectedSchoolId || schoolOptions.length === 0)
            }
          />
        </>
      );
    }

  if (selectedRole === 'teacher') {
    return (
      <>
        <FlashMessage flash={flash} onDismiss={() => setFlash(null)} />
        <TeacherArea
          theme={theme}
          onToggleTheme={toggleTheme}
          onLogout={handleLogout}
          onNotify={showFlash}
          schoolId={selectedSchoolId}
          school={selectedSchoolName}
        />
      </>
    );
  }

  return (
    <>
      <FlashMessage flash={flash} onDismiss={() => setFlash(null)} />
      <StudentArea
        theme={theme}
        onToggleTheme={toggleTheme}
        onLogout={handleLogout}
        onNotify={showFlash}
      />
    </>
  );
}

export default StudentJourneyApp;
