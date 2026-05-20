export const getApiUrl = (endpoint: string): string => {
  if (process.env.NODE_ENV !== 'production') {
    // In dev, prefer the Express backend running on port 3000 so the UI and QA hit the same API implementation
    return `http://localhost:3000${endpoint}`;
  }
  return endpoint;
};
