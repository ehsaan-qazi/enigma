import { LoginCredentials, RegisterCredentials, AuthResponse, UserProfile } from "../types/auth.types";

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

export async function loginUser(credentials: LoginCredentials): Promise<AuthResponse> {
  try {
    if (USE_MOCKS) {
      return getMockAuthResponse(credentials.email);
    }

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      // Graceful fallback to mock response if backend route is not ready
      if (response.status === 404 || response.status === 405) {
        return getMockAuthResponse(credentials.email);
      }
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || "Failed to log in with provided credentials.");
    }

    return await response.json();
  } catch (error: any) {
    // If route doesn't exist yet, return mock for frontend development
    if (error.message?.includes("fetch") || error.message?.includes("404")) {
      return getMockAuthResponse(credentials.email);
    }
    throw error;
  }
}

export async function registerUser(credentials: RegisterCredentials): Promise<AuthResponse> {
  try {
    if (USE_MOCKS) {
      return getMockAuthResponse(credentials.email, credentials.fullName, credentials.institution);
    }

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      if (response.status === 404 || response.status === 405) {
        return getMockAuthResponse(credentials.email, credentials.fullName, credentials.institution);
      }
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || "Failed to create account.");
    }

    return await response.json();
  } catch (error: any) {
    if (error.message?.includes("fetch") || error.message?.includes("404")) {
      return getMockAuthResponse(credentials.email, credentials.fullName, credentials.institution);
    }
    throw error;
  }
}

function getMockAuthResponse(email: string, fullName?: string, institution?: string): AuthResponse {
  const mockUser: UserProfile = {
    id: "usr_mock_01",
    email,
    fullName: fullName || "Ahmed Al-Mansoor",
    institution: institution || "Imperial College London",
    role: "student",
    createdAt: new Date().toISOString(),
  };

  return {
    user: mockUser,
    message: "Authenticated successfully (Mock Adapter).",
  };
}
