import { useAuthStore } from "./store";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const { sessionToken } = useAuthStore.getState();
  
  const headers = new Headers(options.headers || {});
  
  if (sessionToken) {
    headers.set("Authorization", \`Bearer \${sessionToken}\`);
  }

  const response = await fetch(\`\${API_URL}\${endpoint}\`, {
    ...options,
    headers,
  });

  const data = await response.json();
  return data;
}

export async function getDashboardStats() {
  return fetchApi("/api/admin/dashboard");
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
