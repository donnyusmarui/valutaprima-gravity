import { Handler } from '@netlify/functions';
import {
  handleCalculateEstimate,
  handleCreateTransaction,
  handleGetTransactions,
  handleAuthorizeTransaction,
} from '../../src/api/handlers/transactions.handler';

export const handler: Handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const pathParts = event.path.split('/').filter(Boolean);
  const lastPath = pathParts[pathParts.length - 1];

  if (event.httpMethod === 'GET') {
    const userIdStr = event.queryStringParameters?.userId;
    const userId = userIdStr ? parseInt(userIdStr) : undefined;
    const role = event.queryStringParameters?.role;
    const status = event.queryStringParameters?.status;

    const result = await handleGetTransactions({ userId, role, status });
    return {
      statusCode: result.success ? 200 : 500,
      headers,
      body: JSON.stringify(result),
    };
  }

  if (event.httpMethod === 'POST') {
    const body = event.body ? JSON.parse(event.body) : {};

    if (lastPath === 'estimate' || body.action === 'estimate') {
      const result = await handleCalculateEstimate(body);
      return {
        statusCode: result.success ? 200 : 400,
        headers,
        body: JSON.stringify(result),
      };
    }

    if (lastPath === 'authorize' || body.action === 'authorize') {
      const result = await handleAuthorizeTransaction(body);
      return {
        statusCode: result.success ? 200 : 400,
        headers,
        body: JSON.stringify(result),
      };
    }

    // Default POST is create transaction
    const result = await handleCreateTransaction(body);
    return {
      statusCode: result.success ? 200 : 400,
      headers,
      body: JSON.stringify(result),
    };
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
};
