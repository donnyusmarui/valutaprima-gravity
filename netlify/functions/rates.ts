import { Handler } from '@netlify/functions';
import { handleGetRates, handleUpdateRate, handleAddRate, handleDeleteRate } from '../../src/api/handlers/rates.handler';

export const handler: Handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod === 'GET') {
    const result = await handleGetRates();
    return { statusCode: result.success ? 200 : 500, headers, body: JSON.stringify(result) };
  }

  if (event.httpMethod === 'PUT') {
    const body = event.body ? JSON.parse(event.body) : {};
    const result = await handleUpdateRate(body);
    return { statusCode: result.success ? 200 : 400, headers, body: JSON.stringify(result) };
  }

  if (event.httpMethod === 'POST') {
    const body = event.body ? JSON.parse(event.body) : {};
    const result = await handleAddRate(body);
    return { statusCode: result.success ? 200 : 400, headers, body: JSON.stringify(result) };
  }

  if (event.httpMethod === 'DELETE') {
    // Extract currencyCode from path: /api/rates/USD → USD
    const parts = (event.path || '').split('/');
    const currencyCode = parts[parts.length - 1];
    if (!currencyCode) {
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'currencyCode wajib diisi' }) };
    }
    const result = await handleDeleteRate(currencyCode);
    return { statusCode: result.success ? 200 : 400, headers, body: JSON.stringify(result) };
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
};
