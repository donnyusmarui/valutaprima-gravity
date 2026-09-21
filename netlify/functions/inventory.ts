import { Handler } from '@netlify/functions';
import { handleGetDenominations, handleUpdateDenomination } from '../../src/api/handlers/inventory.handler';

export const handler: Handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod === 'GET') {
    const currencyCode = event.queryStringParameters?.currencyCode;
    const result = await handleGetDenominations(currencyCode);
    return {
      statusCode: result.success ? 200 : 500,
      headers,
      body: JSON.stringify(result),
    };
  }

  if (event.httpMethod === 'PUT' || event.httpMethod === 'POST') {
    const body = event.body ? JSON.parse(event.body) : {};
    const result = await handleUpdateDenomination(body);
    return {
      statusCode: result.success ? 200 : 400,
      headers,
      body: JSON.stringify(result),
    };
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
};
