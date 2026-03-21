import { useEffect, useMemo, useState } from 'react';
import FlashMessage from '../components/FlashMessage';
import { api, STORAGE_KEYS } from '../services/apiClient';

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

function getInvitationStatusCopy(status) {
  const normalized = String(status || '').toLowerCase();
  if (normalized.includes('accepted')) {
    return 'Поканата е веќе прифатена.';
  }
  if (normalized.includes('expired')) {
    return 'Поканата е истечена.';
  }
  if (normalized.includes('revoked')) {
    return 'Поканата е повлечена.';
  }

  return 'Поканата е подготвена за прифаќање.';
}

function InvitationAcceptPage({ token }) {
  const [theme] = useState(getInitialTheme);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState(null);
  const [invitation, setInvitation] = useState(null);
  const [formValues, setFormValues] = useState({
    first_name: '',
    last_name: '',
    password: '',
    password_confirmation: '',
  });

  const showFlash = (message, type = 'success') => {
    setFlash({
      id: Date.now(),
      message,
      type,
    });
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
    let isMounted = true;
    setLoading(true);
    setError('');

    api
      .invitationDetails(token)
      .then((payload) => {
        if (!isMounted) {
          return;
        }

        setInvitation(payload);
        setFormValues((previous) => ({
          ...previous,
          first_name: payload?.user?.first_name || '',
          last_name: payload?.user?.last_name || '',
        }));
      })
      .catch((loadError) => {
        if (isMounted) {
          setError(loadError.message || 'Не успеа вчитувањето на поканата.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  const invitationStatusMessage = useMemo(
    () => getInvitationStatusCopy(invitation?.status),
    [invitation?.status]
  );

  const canAccept = Boolean(invitation?.accept_allowed);

  const handleChange = (fieldId, value) => {
    setFormValues((previous) => ({
      ...previous,
      [fieldId]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canAccept || submitting) {
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const payload = await api.acceptInvitation(token, {
        first_name: formValues.first_name.trim(),
        last_name: formValues.last_name.trim(),
        password: formValues.password,
        password_confirmation: formValues.password_confirmation,
      });

      setInvitation(payload?.invitation || invitation);
      setFormValues((previous) => ({
        ...previous,
        password: '',
        password_confirmation: '',
      }));
      showFlash('Поканата е успешно прифатена. Продолжете со најава.', 'success');
    } catch (submitError) {
      setError(submitError.message || 'Прифаќањето не успеа.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <FlashMessage flash={flash} onDismiss={() => setFlash(null)} />
      <main className={`auth-root theme-${theme}`}>
        <section className="auth-card invitation-card">
          <p className="auth-eyebrow">Покана за пристап</p>
          <h1>Прифати покана</h1>
          <p className="auth-help">
            Отворете ја поканата, проверете ги деталите и потоа потврдете го пристапот до
            училиштето.
          </p>

          {loading ? (
            <p className="auth-help">Се вчитува поканата...</p>
          ) : (
            <>
              {invitation ? (
                <div className="invitation-summary">
                  <div className="invitation-summary-row">
                    <span>Училиште</span>
                    <strong>{invitation?.school?.name || 'Непознато училиште'}</strong>
                  </div>
                  <div className="invitation-summary-row">
                    <span>Улога</span>
                    <strong>{invitation?.role_name === 'teacher' ? 'Наставник' : 'Ученик'}</strong>
                  </div>
                  <div className="invitation-summary-row">
                    <span>Е-пошта</span>
                    <strong>{invitation?.email || 'Нема податок'}</strong>
                  </div>
                  <div className="invitation-summary-row">
                    <span>Статус</span>
                    <strong>{invitationStatusMessage}</strong>
                  </div>
                </div>
              ) : null}

              <form className="auth-form invitation-form" onSubmit={handleSubmit}>
                <label>
                  Име
                  <input
                    type="text"
                    value={formValues.first_name}
                    onChange={(event) => handleChange('first_name', event.target.value)}
                    disabled={submitting || !canAccept}
                  />
                </label>

                <label>
                  Презиме
                  <input
                    type="text"
                    value={formValues.last_name}
                    onChange={(event) => handleChange('last_name', event.target.value)}
                    disabled={submitting || !canAccept}
                  />
                </label>

                <label>
                  Лозинка
                  <input
                    type="password"
                    value={formValues.password}
                    onChange={(event) => handleChange('password', event.target.value)}
                    placeholder="Оставете празно ако веќе имате активна сметка"
                    disabled={submitting || !canAccept}
                  />
                </label>

                <label>
                  Потврди лозинка
                  <input
                    type="password"
                    value={formValues.password_confirmation}
                    onChange={(event) => handleChange('password_confirmation', event.target.value)}
                    placeholder="Повторете ја лозинката ако поставувате нова"
                    disabled={submitting || !canAccept}
                  />
                </label>

                {!canAccept && invitation ? (
                  <p className="auth-help invitation-status-note">{invitationStatusMessage}</p>
                ) : (
                  <p className="auth-help invitation-status-note">
                    Ако веќе имате активна сметка, лозинката може да остане празна. Ако ова е
                    ваша прва активација, внесете и потврдете нова лозинка.
                  </p>
                )}

                {error ? <p className="auth-error">{error}</p> : null}

                <button type="submit" className="btn btn-primary auth-submit" disabled={!canAccept || submitting}>
                  {submitting ? 'Се прифаќа...' : 'Прифати покана'}
                </button>

                {!canAccept ? (
                  <a className="forgot-link" href="/">
                    Отвори најава
                  </a>
                ) : null}
              </form>
            </>
          )}
        </section>
      </main>
    </>
  );
}

export default InvitationAcceptPage;
