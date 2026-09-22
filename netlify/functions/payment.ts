// netlify/functions/payment.ts — Adapter Netlify untuk payment.handler
import type { Handler, HandlerEvent } from '@netlify/functions';
import {
  handleCreatePayment,
  handleWebhookNotification,
  handleGetPaymentStatus,
} from '../../src/api/handlers/payment.handler.js';

export const handler: Handler = async (event: HandlerEvent) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Path: /.netlify/functions/payment/create
  //       /.netlify/functions/payment/webhook
  //       /.netlify/functions/payment/status/:id
  const pathParts = (event.path || '').split('/').filter(Boolean);
  const action = pathParts[pathParts.length - 1]; // last segment

  try {
    if (event.httpMethod === 'POST' && action === 'create') {
      const body = JSON.parse(event.body || '{}');
      const result = await handleCreatePayment(body);
      return {
        statusCode: result.success ? 200 : 400,
        headers,
        body: JSON.stringify(result),
      };
    }

    if (event.httpMethod === 'POST' && action === 'webhook') {
      const body = JSON.parse(event.body || '{}');
      const result = await handleWebhookNotification(body);
      // Webhook HARUS return 200 agar Midtrans tidak retry
      return { statusCode: 200, headers, body: JSON.stringify(result) };
    }

    if (event.httpMethod === 'GET' && action === 'status') {
      const txnId = parseInt(event.queryStringParameters?.id || '0');
      const result = await handleGetPaymentStatus(txnId);
      return {
        statusCode: result.success ? 200 : 404,
        headers,
        body: JSON.stringify(result),
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ success: false, error: `Payment action '${action}' tidak ditemukan` }),
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: msg }) };
  }
};
