export const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';

export const apiFetch = (path, options) => fetch(`${API_BASE_URL}${path}`, options);
