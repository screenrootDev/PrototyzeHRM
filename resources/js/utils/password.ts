/**
 * Generate a strong password
 * @param length Length of the password
 * @returns A strong random password
 */
export const generateStrongPassword = (length = 12): string => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
  let retVal = "";
  for (let i = 0, n = charset.length; i < length; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * n));
  }
  
  // Ensure it has at least one of each required type
  const hasUpper = /[A-Z]/.test(retVal);
  const hasLower = /[a-z]/.test(retVal);
  const hasNumber = /[0-9]/.test(retVal);
  const hasSpecial = /[!@#$%^&*()_+~`|}{[\]:;?><,./-=@]/.test(retVal);
  
  if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
    return generateStrongPassword(length); // Regenerate if it's not strong enough
  }
  
  return retVal;
};

/**
 * Calculate password strength
 * @param password The password to check
 * @returns A score from 0 to 4
 */
export const calculatePasswordStrength = (password: string): number => {
  if (!password) return 0;
  
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*()_+~`|}{[\]:;?><,./-=@]/.test(password)) score++;
  
  // Normalize to 0-4
  if (score > 4) score = 4;
  return score;
};

export const getStrengthLabel = (score: number): { label: string, color: string } => {
  switch (score) {
    case 0: return { label: 'Very Weak', color: 'text-red-500 bg-red-500' };
    case 1: return { label: 'Weak', color: 'text-orange-500 bg-orange-500' };
    case 2: return { label: 'Fair', color: 'text-yellow-500 bg-yellow-500' };
    case 3: return { label: 'Strong', color: 'text-green-500 bg-green-500' };
    case 4: return { label: 'Very Strong', color: 'text-emerald-600 bg-emerald-600' };
    default: return { label: 'Very Weak', color: 'text-red-500 bg-red-500' };
  }
};
