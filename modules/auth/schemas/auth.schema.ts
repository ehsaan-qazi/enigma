export function validateEmail(email: string): string | null {
  if (!email || !email.trim()) return "Email address is required.";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) return "Please enter a valid academic email address.";
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "Password is required.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  return null;
}

export function validateFullName(name: string): string | null {
  if (!name || !name.trim()) return "Full name is required.";
  if (name.trim().length < 2) return "Name must be at least 2 characters.";
  return null;
}

export function validateInstitution(institution: string): string | null {
  if (!institution || !institution.trim()) return "Academic institution is required.";
  return null;
}
