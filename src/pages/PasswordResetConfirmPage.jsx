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

function getResetStatusCopy(status) {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'used') {
    return 'Линкот е веќе искористен.';
  }
  if (normalized === 'expired') {
    return 'Линкот е истечен.';
  }
  return 'Линкот е подготвен за нова лозинка.';
}

function PasswordResetConfirmPage({ token }) {
  const [theme] = useState(getInitialTheme);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState(null);
  const [resetDetails, setResetDetails] = useState(null);
  const [formValues, setFormValues] = useState({
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
      .passwordResetDetails(token)
      .then((payload) => {
        if (isMounted) {
          setResetDetails(payload);
        }
      })
      .catch((loadError) => {
        if (isMounted) {
          setError(loadError.message || 'Линкот за ресетирање не е валиден.');
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

  const statusMessage = useMemo(
    () => getResetStatusCopy(resetDetails?.status),
    [resetDetails?.status]
  );

  const canConfirm = Boolean(resetDetails?.confirm_allowed);

  const handleChange = (field, value) => {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canConfirm || submitting) {
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const payload = await api.confirmPasswordReset(token, formValues);
      setResetDetails(payload?.password_reset || resetDetails);
      setFormValues({
        password: '',
        password_confirmation: '',
      });
      showFlash('Лозинката е успешно сменета. Може да се најавите со новата лозинка.', 'success');
    } catch (submitError) {
      setError(submitError.message || 'Не успеа промената на лозинката.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <FlashMessage flash={flash} onDismiss={() => setFlash(null)} />
      <main className={`auth-root theme-${theme}`}>
        <section className="auth-card invitation-card">
          <a href="/" className="back-link back-link-icon" aria-label="Назад кон најава">
            <span aria-hidden="true">←</span>
          </a>
          <p className="auth-eyebrow">Нова лозинка</p>
          <h1>Потврди reset</h1>
          <p className="auth-help">
            Поставете нова лозинка преку добиениот линк. Линкот важи 30 минути и може да се
            искористи само еднаш.
          </p>

          {loading ? (
            <p className="auth-help">Се проверува линкот...</p>
          ) : (
            <>
              {resetDetails ? (
                <div className="invitation-summary">
                  <div className="invitation-summary-row">
                    <span>Е-пошта</span>
                    <strong>{resetDetails.email || 'Нема податок'}</strong>
                  </div>
                  <div className="invitation-summary-row">
                    <span>Статус</span>
                    <strong>{statusMessage}</strong>
                  </div>
                  <div className="invitation-summary-row">
                    <span>Истекува</span>
                    <strong>{resetDetails.expires_at || resetDetails.expiresAt || 'Нема податок'}</strong>
                  </div>
                </div>
              ) : null}

              <form className="auth-form invitation-form" onSubmit={handleSubmit}>
                <label>
                  Нова лозинка
                  <input
                    type="password"
                    value={formValues.password}
                    onChange={(event) => handleChange('password', event.target.value)}
                    placeholder="Најмалку 8 знаци"
                    disabled={!canConfirm || submitting}
                    required={canConfirm}
                  />
                </label>

                <label>
                  Потврди нова лозинка
                  <input
                    type="password"
                    value={formValues.password_confirmation}
                    onChange={(event) => handleChange('password_confirmation', event.target.value)}
                    placeholder="Повторете ја новата лозинка"
                    disabled={!canConfirm || submitting}
                    required={canConfirm}
                  />
                </label>

                {!canConfirm && resetDetails ? (
                  <p className="auth-help invitation-status-note">
                    Овој линк повеќе не може да се искористи. Побарајте нов reset линк.
                  </p>
                ) : null}

                {error ? <p className="auth-error">{error}</p> : null}

                <button type="submit" className="btn btn-primary auth-submit" disabled={!canConfirm || submitting}>
                  {submitting ? 'Се зачувува...' : 'Постави нова лозинка'}
                </button>
                <a href={canConfirm ? '/' : '/password-reset'} className="forgot-link">
                  {canConfirm ? 'Назад кон најава' : 'Побарај нов линк'}
                </a>
              </form>
            </>
          )}
        </section>
      </main>
    </>
  );
}

export default PasswordResetConfirmPage;
