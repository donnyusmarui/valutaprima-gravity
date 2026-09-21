import { Handler } from '@netlify/functions';
import { handleHealthCheck } from '../../src/api/handlers/health.handler';

export const handler: Handler = async (_event, _context) => {
  const result = await handleHealthCheck();
  return {
    statusCode: result.success ? 200 : 500,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(result),
  };
};
