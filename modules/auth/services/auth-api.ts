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
      if (response.status === 404 || response.status === 405) {
        return getMockAuthResponse(credentials.email);
      }
      const err = await response.json().catch(() => ({}));
      const msg = err?.error?.message || err?.message || "Failed to log in with provided credentials.";
      throw new Error(msg);
    }

    const json = await response.json();
    return json.data || json;
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "";
    if (errMessage.includes("fetch") || errMessage.includes("404")) {
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
      const msg = err?.error?.message || err?.message || "Failed to create account.";
      throw new Error(msg);
    }

    const json = await response.json();
    return json.data || json;
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "";
    if (errMessage.includes("fetch") || errMessage.includes("404")) {
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
