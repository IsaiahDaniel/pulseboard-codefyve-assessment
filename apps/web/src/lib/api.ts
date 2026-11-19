const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:4200/api/v1";

export type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  message?: string;
};

function unwrap<T>(body: ApiEnvelope<T> | T): T {
  if (body && typeof body === "object" && "data" in body && body.data !== undefined) {
    return body.data;
  }
  return body as T;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const { token, headers, ...rest } = options;
  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });
  const json = (await res.json().catch(() => ({}))) as ApiEnvelope<T> & {
    message?: string;
    statusCode?: number;
  };
  if (!res.ok) {
    throw new Error(json.message || `Request failed (${res.status})`);
  }
  return unwrap(json);
}

export { API_BASE };
