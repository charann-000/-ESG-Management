import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import useAuth from '../../hooks/useAuth';
import { validateLoginForm } from '../../utils/validators';
import { getDashboardPath } from '../../context/AuthContext';
import AuthLayout from '../../components/AuthLayout';

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const clearFieldError = useCallback((field) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setServerError('');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    /* Client-side validation */
    const validation = validateLoginForm(email, password);
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      if (validation.errors.email && emailRef.current) emailRef.current.focus();
      else if (validation.errors.password && passwordRef.current) passwordRef.current.focus();
      return;
    }

    setFieldErrors({});
    setServerError('');
    setIsSubmitting(true);

    try {
      const userData = await login(email, password);

      toast.success('Welcome back! Redirecting…');

      setTimeout(() => {
        if (userData.isPasswordChangeRequired) {
          navigate('/change-password', { replace: true });
        } else {
          navigate(getDashboardPath(userData.role), { replace: true });
        }
      }, 800);
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'An unexpected error occurred. Please try again.';
      setServerError(message);
      if (passwordRef.current) passwordRef.current.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="login-wrapper">
        <h1>Welcome back</h1>
        <p className="login-subtitle">
          Log in to access your live ESG scoring dashboard and operational metrics.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div className={`field ${fieldErrors.email ? 'field--error' : ''}`}>
            <label htmlFor="email">Work Email</label>
            <input
              ref={emailRef}
              type="email"
              id="email"
              placeholder="name@company.com"
              required
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearFieldError('email'); }}
              disabled={isSubmitting}
              autoComplete="email"
              autoFocus
            />
            {fieldErrors.email && (
              <span className="field__error" role="alert">{fieldErrors.email}</span>
            )}
          </div>

          {/* Password */}
          <div className={`field ${fieldErrors.password ? 'field--error' : ''}`}>
            <label htmlFor="password">Password</label>
            <input
              ref={passwordRef}
              type="password"
              id="password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearFieldError('password'); }}
              disabled={isSubmitting}
              autoComplete="current-password"
            />
            {fieldErrors.password && (
              <span className="field__error" role="alert">{fieldErrors.password}</span>
            )}
          </div>

          {/* Server Error */}
          {serverError && (
            <div className="server-error" role="alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{serverError}</span>
            </div>
          )}

          {/* Options */}
          <div className="form-options">
            <label>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isSubmitting}
              />
              Remember me
            </label>
            <a href="#">Forgot password?</a>
          </div>

          {/* Submit */}
          <button type="submit" className="btn" disabled={isSubmitting} id="login-submit-btn">
            {isSubmitting ? (
              <>
                <span className="btn-spinner" aria-hidden="true"></span>
                Signing In…
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
    </AuthLayout>
  );
}

export default Login;
