// netlify/functions/invoice.ts — Adapter Netlify untuk invoice.handler
import type { Handler, HandlerEvent } from '@netlify/functions';
import {
  handleGetInvoiceData,
  handleGetAuditLog,
  handleGetPpatkReport,
} from '../../src/api/handlers/invoice.handler.js';

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

  const pathParts = (event.path || '').split('/').filter(Boolean);
  const action = pathParts[pathParts.length - 1];

  try {
    // GET /api/invoice/data?transactionId=X
    if (event.httpMethod === 'GET' && action === 'data') {
      const txnId = parseInt(event.queryStringParameters?.transactionId || '0');
      const result = await handleGetInvoiceData(txnId);
      return { statusCode: result.success ? 200 : 404, headers, body: JSON.stringify(result) };
    }

    // GET /api/invoice/audit-log?amlOnly=true&limit=100
    if (event.httpMethod === 'GET' && action === 'audit-log') {
      const { amlOnly, currencyCode, startDate, endDate, limit } = event.queryStringParameters || {};
      const result = await handleGetAuditLog({
        amlOnly: amlOnly === 'true',
        currencyCode,
        startDate,
        endDate,
        limit: limit ? parseInt(limit) : 100,
      });
      return { statusCode: 200, headers, body: JSON.stringify(result) };
    }

    // GET /api/invoice/ppatk-report
    if (event.httpMethod === 'GET' && action === 'ppatk-report') {
      const result = await handleGetPpatkReport();
      return { statusCode: 200, headers, body: JSON.stringify(result) };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ success: false, error: `Invoice action '${action}' tidak ditemukan` }),
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: msg }) };
  }
};
