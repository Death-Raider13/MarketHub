export const PASSWORD_MIN_LENGTH = 12

export interface PasswordPolicyResult {
  valid: boolean
  message?: string
}

export function validatePassword(password: string): PasswordPolicyResult {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { valid: false, message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long.` }
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter.' }
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter.' }
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number.' }
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character.' }
  }
  return { valid: true }
}

export const PASSWORD_REQUIREMENTS = [
  `At least ${PASSWORD_MIN_LENGTH} characters`,
  'One uppercase letter',
  'One lowercase letter',
  'One number',
  'One special character',
]
