import { Handler } from '@netlify/functions';
import {
  handleGetMe,
  handleDevSwitchRole,
  handleGoogleOAuthCallback,
  handleEmailLogin,
  handleEmailRegister,
} from '../../src/api/handlers/auth.handler';

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
    const userIdOrEmail = event.queryStringParameters?.userId || event.queryStringParameters?.email || 'customer@valutaprima.com';
    const idNum = parseInt(userIdOrEmail);
    const result = await handleGetMe(isNaN(idNum) ? userIdOrEmail : idNum);
    return {
      statusCode: result.success ? 200 : 404,
      headers,
      body: JSON.stringify(result),
    };
  }

  if (event.httpMethod === 'POST') {
    const body = event.body ? JSON.parse(event.body) : {};

    if (path === 'login') {
      const result = await handleEmailLogin(body);
      return {
        statusCode: result.success ? 200 : 400,
        headers,
        body: JSON.stringify(result),
      };
    }

    if (path === 'register') {
      const result = await handleEmailRegister(body);
      return {
        statusCode: result.success ? 200 : 400,
        headers,
        body: JSON.stringify(result),
      };
    }

    if (path === 'dev-switch') {
      const result = await handleDevSwitchRole(body.role || 'customer');
      return {
        statusCode: result.success ? 200 : 400,
        headers,
        body: JSON.stringify(result),
      };
    }

    if (path === 'google') {
      const result = await handleGoogleOAuthCallback(body);
      return {
        statusCode: result.success ? 200 : 400,
        headers,
        body: JSON.stringify(result),
      };
    }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
};
