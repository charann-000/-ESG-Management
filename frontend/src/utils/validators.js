const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export function validateEmail(email) {
  if (!email || !email.trim()) {
    return 'Email address is required';
  }
  if (!EMAIL_REGEX.test(email.trim())) {
    return 'Please enter a valid email address';
  }
  return '';
}

export function validatePassword(password) {
  if (!password) {
    return 'Password is required';
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  return '';
}

export function validateLoginForm(email, password) {
  const errors = {};

  const emailError = validateEmail(email);
  if (emailError) {
    errors.email = emailError;
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    errors.password = passwordError;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateChangePasswordForm(oldPassword, newPassword, confirmPassword) {
  const errors = {};

  if (!oldPassword) {
    errors.oldPassword = 'Current password is required';
  }

  if (!newPassword) {
    errors.newPassword = 'New password is required';
  } else if (newPassword.length < MIN_PASSWORD_LENGTH) {
    errors.newPassword = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  } else if (!/[a-z]/.test(newPassword)) {
    errors.newPassword = 'Password must contain at least one lowercase letter';
  } else if (!/[A-Z]/.test(newPassword)) {
    errors.newPassword = 'Password must contain at least one uppercase letter';
  } else if (!/[0-9]/.test(newPassword)) {
    errors.newPassword = 'Password must contain at least one number';
  } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
    errors.newPassword = 'Password must contain at least one special character';
  }

  if (newPassword && confirmPassword && newPassword !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Please confirm your new password';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
