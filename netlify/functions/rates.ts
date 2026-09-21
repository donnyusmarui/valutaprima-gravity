import { Handler } from '@netlify/functions';
import { handleGetRates, handleUpdateRate } from '../../src/api/handlers/rates.handler';

export const handler: Handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod === 'GET') {
    const result = await handleGetRates();
    return {
      statusCode: result.success ? 200 : 500,
      headers,
      body: JSON.stringify(result),
    };
  }

  if (event.httpMethod === 'PUT') {
    const body = event.body ? JSON.parse(event.body) : {};
    const result = await handleUpdateRate(body);
    return {
      statusCode: result.success ? 200 : 400,
      headers,
      body: JSON.stringify(result),
    };
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
};
