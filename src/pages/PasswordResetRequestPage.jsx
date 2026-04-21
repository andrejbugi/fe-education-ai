import { useEffect, useState } from 'react';
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

function PasswordResetRequestPage() {
  const [theme] = useState(getInitialTheme);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [flash, setFlash] = useState(null);

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.requestPasswordReset({ email: email.trim() });
      setSuccess(true);
      showFlash('Ако сметката постои, испративме линк за ресетирање.', 'success');
    } catch (requestError) {
      setError(requestError.message || 'Не успеа испраќањето на линкот.');
    } finally {
      setLoading(false);
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
          <p className="auth-eyebrow">Ресетирање лозинка</p>
          <h1>Испрати reset линк</h1>
          <p className="auth-help">
            Внесете ја е-поштата на сметката. Ако постои активен корисник, ќе добиете линк за
            поставување нова лозинка.
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              Е-пошта
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="teacher@example.com"
                required
                disabled={loading || success}
              />
            </label>

            {success ? (
              <div className="invitation-summary">
                <div className="invitation-summary-row">
                  <span>Следно</span>
                  <strong>Проверете ја вашата е-пошта и отворете го линкот.</strong>
                </div>
              </div>
            ) : null}

            {error ? <p className="auth-error">{error}</p> : null}

            <button type="submit" className="btn btn-primary auth-submit" disabled={loading || success}>
              {loading ? 'Се испраќа...' : success ? 'Испратено' : 'Испрати линк'}
            </button>
            <a href="/" className="forgot-link">
              Назад кон најава
            </a>
          </form>
        </section>
      </main>
    </>
  );
}

export default PasswordResetRequestPage;
