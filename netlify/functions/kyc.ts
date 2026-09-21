import { Handler } from '@netlify/functions';
import {
  handleSubmitKyc,
  handleGetMyKyc,
  handleGetPendingKyc,
  handleReviewKyc,
} from '../../src/api/handlers/kyc.handler';

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

  const path = event.path.split('/').pop();

  if (event.httpMethod === 'GET') {
    if (path === 'pending') {
      const result = await handleGetPendingKyc();
      return {
        statusCode: result.success ? 200 : 500,
        headers,
        body: JSON.stringify(result),
      };
    }

    const userId = parseInt(event.queryStringParameters?.userId || '');
    if (isNaN(userId)) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'User ID tidak valid' }) };
    }
    const result = await handleGetMyKyc(userId);
    return {
      statusCode: result.success ? 200 : 400,
      headers,
      body: JSON.stringify(result),
    };
  }

  if (event.httpMethod === 'POST') {
    const body = event.body ? JSON.parse(event.body) : {};

    if (path === 'review') {
      const result = await handleReviewKyc(body);
      return {
        statusCode: result.success ? 200 : 400,
        headers,
        body: JSON.stringify(result),
      };
    }

    const result = await handleSubmitKyc(body);
    return {
      statusCode: result.success ? 200 : 400,
      headers,
      body: JSON.stringify(result),
    };
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
};
