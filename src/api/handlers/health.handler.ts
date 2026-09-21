export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export async function handleHealthCheck(): Promise<ApiResponse> {
  const mode = process.env.DB_MODE || 'development';
  return {
    success: true,
    message: 'Valutaprima Gravity API is healthy and operational.',
    data: {
      app: 'valutaprima-gravity',
      version: '3.0.0',
      mode,
      timestamp: new Date().toISOString(),
    },
  };
}
