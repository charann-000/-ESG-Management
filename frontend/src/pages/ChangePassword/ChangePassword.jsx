import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import useAuth from '../../hooks/useAuth';
import authService from '../../services/authService';
import { validateChangePasswordForm } from '../../utils/validators';
import { getDashboardPath } from '../../context/AuthContext';
import Loader from '../../components/Loader';
import './ChangePassword.css';

function ChangePassword() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const oldRef = useRef(null);
  const newRef = useRef(null);
  const confirmRef = useRef(null);

  const clearFieldError = (field) => {
    setErrors((prev) => {
      const updated = { ...prev };
      delete updated[field];
      return updated;
    });
    setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validation = validateChangePasswordForm(oldPassword, newPassword, confirmPassword);
    if (!validation.isValid) {
      setErrors(validation.errors);
      if (validation.errors.oldPassword && oldRef.current) oldRef.current.focus();
      else if (validation.errors.newPassword && newRef.current) newRef.current.focus();
      else if (validation.errors.confirmPassword && confirmRef.current) confirmRef.current.focus();
      return;
    }

    setErrors({});
    setServerError('');
    setIsSubmitting(true);

    try {
      await authService.changePassword(oldPassword, newPassword);

      toast.success('Password changed successfully!', {
        position: 'top-right',
        autoClose: 2000,
        theme: 'dark',
      });

      setTimeout(() => {
        const dashboardPath = getDashboardPath(user?.role);
        navigate(dashboardPath, { replace: true });
      }, 1000);
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to change password. Please try again.';
      setServerError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const PasswordField = ({ id, label, value, setValue, show, setShow, error, fieldRef, autoFocus, errorField }) => (
    <div className={`form-group ${error ? 'form-group--error' : ''}`}>
      <label className="form-group__label" htmlFor={id}>{label}</label>
      <div className="form-group__input-wrapper">
        <span className="form-group__icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </span>
        <input
          ref={fieldRef}
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => { setValue(e.target.value); clearFieldError(errorField); }}
          placeholder={label}
          disabled={isSubmitting}
          autoComplete="off"
          autoFocus={autoFocus}
          className="form-group__input"
        />
        <button
          type="button"
          className="form-group__toggle"
          onClick={() => setShow((v) => !v)}
          disabled={isSubmitting}
          tabIndex={-1}
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          )}
        </button>
      </div>
      {error && (
        <p className="form-group__error" role="alert">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {error}
        </p>
      )}
    </div>
  );

  return (
    <div className="change-password-page">
      <div className="change-password-card">
        <div className="change-password-card__header">
          <div className="change-password-card__icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="url(#cp-grad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <defs>
                <linearGradient id="cp-grad" x1="4" y1="2" x2="20" y2="22">
                  <stop stopColor="#34d399" />
                  <stop offset="1" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 className="change-password-card__title">Change Password</h1>
          <p className="change-password-card__subtitle">
            {user?.isPasswordChangeRequired
              ? 'You must change your password before continuing.'
              : 'Update your password to keep your account secure.'}
          </p>
        </div>

        <form className="change-password-card__form" onSubmit={handleSubmit} noValidate>
          <PasswordField
            id="old-password"
            label="Current Password"
            value={oldPassword}
            setValue={setOldPassword}
            show={showOld}
            setShow={setShowOld}
            error={errors.oldPassword}
            fieldRef={oldRef}
            autoFocus
            errorField="oldPassword"
          />
          <PasswordField
            id="new-password"
            label="New Password"
            value={newPassword}
            setValue={setNewPassword}
            show={showNew}
            setShow={setShowNew}
            error={errors.newPassword}
            fieldRef={newRef}
            errorField="newPassword"
          />
          <PasswordField
            id="confirm-password"
            label="Confirm New Password"
            value={confirmPassword}
            setValue={setConfirmPassword}
            show={showConfirm}
            setShow={setShowConfirm}
            error={errors.confirmPassword}
            fieldRef={confirmRef}
            errorField="confirmPassword"
          />

          {serverError && (
            <div className="login-card__server-error" role="alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span>{serverError}</span>
            </div>
          )}

          <button
            type="submit"
            className="login-card__submit"
            disabled={isSubmitting}
            id="change-password-submit-btn"
          >
            {isSubmitting ? (
              <>
                <Loader size="small" color="white" />
                <span>Updating...</span>
              </>
            ) : (
              <>
                <span>Update Password</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChangePassword;
