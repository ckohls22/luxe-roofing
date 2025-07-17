import { toast } from "sonner";

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

const API_BASE_URL = "/api";

async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "An error occurred" }));
    throw new ApiError(response.status, error.message || "An error occurred");
  }

  const data = await response.json();
  return { data };
}

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    return await handleResponse<T>(response);
  } catch (error) {
    if (error instanceof ApiError) {
      toast.error(error.message);
      return { error: error.message };
    }

    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";
    toast.error(message);
    return { error: message };
  }
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    fetchApi<T>(endpoint, { ...options, method: "GET" }),

  post: <T>(endpoint: string, data: unknown, options?: RequestInit) =>
    fetchApi<T>(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(data),
    }),

  put: <T>(endpoint: string, data: unknown, options?: RequestInit) =>
    fetchApi<T>(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: <T>(endpoint: string, options?: RequestInit) =>
    fetchApi<T>(endpoint, { ...options, method: "DELETE" }),
};
