import { useRef, useEffect } from 'react';

function InputField({
  id,
  type = 'text',
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  disabled = false,
  autoComplete,
  autoFocus = false,
  icon,
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  return (
    <div className={`input-field ${error ? 'input-field--error' : ''} ${disabled ? 'input-field--disabled' : ''}`}>
      {label && (
        <label className="input-field__label" htmlFor={id}>
          {label}
        </label>
      )}
      <div className="input-field__wrapper">
        {icon && <span className="input-field__icon">{icon}</span>}
        <input
          ref={inputRef}
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          className="input-field__input"
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        />
      </div>
      {error && (
        <p className="input-field__error" id={`${id}-error`} role="alert">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

export default InputField;
