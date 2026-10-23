const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

// Carries the HTTP status and the full response body.
// For a 409 the body contains `currentTask`, which the conflict UI in F5 will use.
export class ApiError extends Error {
  constructor(status, message, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${BASE_URL}/api${path}`, {
      ...options,
      credentials: "include", // send and receive the httpOnly auth cookie
      headers: { "Content-Type": "application/json", ...options.headers },
    });
  } catch {
    throw new ApiError(0, "Cannot reach the server. Is the backend running?");
  }

  const data = await res.json().catch(() => null);
  if (!res.ok)
    throw new ApiError(
      res.status,
      data?.message ?? "Something went wrong",
      data,
    );
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) =>
    request(path, { method: "POST", body: JSON.stringify(body ?? {}) }),
  patch: (path, body) =>
    request(path, { method: "PATCH", body: JSON.stringify(body ?? {}) }),
  delete: (path) => request(path, { method: "DELETE" }),
};
