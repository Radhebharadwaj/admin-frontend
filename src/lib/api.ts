import { useAuthStore } from "./store";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://admin-backend.pixraglobal.workers.dev";

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const { sessionToken } = useAuthStore.getState();
  
  const headers = new Headers(options.headers || {});
  
  if (sessionToken) {
    headers.set("Authorization", `Bearer ${sessionToken}`);
  }

  // Don't override Content-Type if body is FormData
  if (options.body instanceof FormData) {
    headers.delete("Content-Type");
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      if (typeof window !== "undefined") {
        import("react-hot-toast").then((module) => {
          module.default.error("Session expired. Please log in again in a new tab.", {
            duration: 10000,
            id: "session-expired",
          });
        });
      }
      // Return gracefully so the app doesn't crash or redirect
      return { success: false, message: "Session expired. Please log in again in a new tab." };
    }

    // Attempt to parse JSON safely
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      return data;
    } else {
      return { success: false, message: `Server returned non-JSON response (${response.status})` };
    }
  } catch (error: any) {
    console.error("API Fetch Error:", error);
    return { success: false, message: error.message || "Network Error" };
  }
}

export const swrFetcher = async (endpoint: string) => {
  const res = await fetchApi(endpoint);
  if (!res.success) {
    throw new Error(res.message || "Failed to fetch data");
  }
  return res.data;
};

export async function getDashboardStats() {
  return fetchApi("/api/admin/dashboard");
}

export async function getAdminProfile() {
  return fetchApi("/api/admin/me");
}

export async function getDropdownData() {
  return fetchApi("/api/admin/dropdown");
}

export async function publishAssignmentData(formData: FormData) {
  return fetchApi("/api/admin/publish", {
    method: "POST",
    body: formData,
  });
}

