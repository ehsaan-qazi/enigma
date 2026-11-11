export type UserRole = "student" | "instructor" | "evaluator";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  institution?: string;
  role: UserRole;
  createdAt: string;
}

export interface AuthSession {
  user: UserProfile | null;
  token?: string;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  fullName: string;
  institution: string;
  role?: UserRole;
}

export interface AuthResponse {
  user: UserProfile;
  message?: string;
}
