export const API_BASE_URL =
  typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : process.env.NEXT_PUBLIC_API_URL || 'https://vaulttrace-backend.vercel.app';

export const getApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};
