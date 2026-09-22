import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { handleHealthCheck } from '../api/handlers/health.handler';
import {
  handleGetMe,
  handleDevSwitchRole,
  handleGoogleOAuthCallback,
  handleEmailLogin,
  handleEmailRegister,
} from '../api/handlers/auth.handler';
import { handleGetRates, handleUpdateRate, handleAddRate, handleDeleteRate } from '../api/handlers/rates.handler';
import {
  handleSubmitKyc,
  handleGetMyKyc,
  handleGetPendingKyc,
  handleReviewKyc,
} from '../api/handlers/kyc.handler';
import {
  handleCalculateEstimate,
  handleCreateTransaction,
  handleGetTransactions,
  handleAuthorizeTransaction,
} from '../api/handlers/transactions.handler';
import {
  handleGetDenominations,
  handleUpdateDenomination,
} from '../api/handlers/inventory.handler';
import {
  handleCreatePayment,
  handleWebhookNotification,
  handleGetPaymentStatus,
} from '../api/handlers/payment.handler';
import {
  handleGetInvoiceData,
  handleGetAuditLog,
  handleGetPpatkReport,
} from '../api/handlers/invoice.handler';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Support base64 image preview for KYC upload

// Health Check
app.get('/api/health', async (_req, res) => {
  const result = await handleHealthCheck();
  res.status(result.success ? 200 : 500).json(result);
});

// Auth Endpoints
app.post('/api/auth/dev-switch', async (req, res) => {
  const { role } = req.body;
  const result = await handleDevSwitchRole(role || 'customer');
  res.status(result.success ? 200 : 400).json(result);
});

app.get('/api/auth/me', async (req, res) => {
  const userIdOrEmail = (req.query.userId as string) || (req.query.email as string) || 'customer@valutaprima.com';
  const idNum = parseInt(userIdOrEmail);
  const result = await handleGetMe(isNaN(idNum) ? userIdOrEmail : idNum);
  res.status(result.success ? 200 : 404).json(result);
});

app.post('/api/auth/google', async (req, res) => {
  const { email, name, avatarUrl } = req.body;
  const result = await handleGoogleOAuthCallback({ email, name, avatarUrl });
  res.status(result.success ? 200 : 400).json(result);
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const result = await handleEmailLogin({ email, password });
  res.status(result.success ? 200 : 400).json(result);
});

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  const result = await handleEmailRegister({ name, email, password });
  res.status(result.success ? 200 : 400).json(result);
});

// Rates Endpoints
app.get('/api/rates', async (_req, res) => {
  const result = await handleGetRates();
  res.status(result.success ? 200 : 500).json(result);
});

app.put('/api/rates/update', async (req, res) => {
  const result = await handleUpdateRate(req.body);
  res.status(result.success ? 200 : 400).json(result);
});

app.post('/api/rates', async (req, res) => {
  const result = await handleAddRate(req.body);
  res.status(result.success ? 200 : 400).json(result);
});

app.delete('/api/rates/:currencyCode', async (req, res) => {
  const result = await handleDeleteRate(req.params.currencyCode);
  res.status(result.success ? 200 : 400).json(result);
});

// KYC Endpoints
app.post('/api/kyc/submit', async (req, res) => {
  const result = await handleSubmitKyc(req.body);
  res.status(result.success ? 200 : 400).json(result);
});

app.get('/api/kyc/my', async (req, res) => {
  const userId = parseInt(req.query.userId as string);
  if (isNaN(userId)) {
    return res.status(400).json({ success: false, error: 'User ID tidak valid' });
  }
  const result = await handleGetMyKyc(userId);
  res.status(result.success ? 200 : 400).json(result);
});

app.get('/api/kyc/pending', async (_req, res) => {
  const result = await handleGetPendingKyc();
  res.status(result.success ? 200 : 500).json(result);
});

app.post('/api/kyc/review', async (req, res) => {
  const result = await handleReviewKyc(req.body);
  res.status(result.success ? 200 : 400).json(result);
});

// Inventory (Denominasi Kas Fisik) Endpoints
app.get('/api/inventory', async (req, res) => {
  const currencyCode = req.query.currencyCode as string;
  const result = await handleGetDenominations(currencyCode);
  res.status(result.success ? 200 : 500).json(result);
});

app.put('/api/inventory/update', async (req, res) => {
  const result = await handleUpdateDenomination(req.body);
  res.status(result.success ? 200 : 400).json(result);
});

// Transactions Endpoints
app.post('/api/transactions/estimate', async (req, res) => {
  const result = await handleCalculateEstimate(req.body);
  res.status(result.success ? 200 : 400).json(result);
});

app.post('/api/transactions', async (req, res) => {
  const result = await handleCreateTransaction(req.body);
  res.status(result.success ? 200 : 400).json(result);
});

app.get('/api/transactions', async (req, res) => {
  const userIdStr = req.query.userId as string;
  const userId = userIdStr ? parseInt(userIdStr) : undefined;
  const role = req.query.role as string;
  const status = req.query.status as string;
  const result = await handleGetTransactions({ userId, role, status });
  res.status(result.success ? 200 : 500).json(result);
});

app.post('/api/transactions/authorize', async (req, res) => {
  const result = await handleAuthorizeTransaction(req.body);
  res.status(result.success ? 200 : 400).json(result);
});

// Payment Endpoints (Sprint 3 Langkah 7)
app.post('/api/payment/create', async (req, res) => {
  const result = await handleCreatePayment(req.body);
  res.status(result.success ? 200 : 400).json(result);
});

app.post('/api/payment/webhook', async (req, res) => {
  const result = await handleWebhookNotification(req.body);
  res.status(200).json(result); // Webhook SELALU 200
});

app.get('/api/payment/status', async (req, res) => {
  const txnId = parseInt(req.query.id as string || '0');
  const result = await handleGetPaymentStatus(txnId);
  res.status(result.success ? 200 : 404).json(result);
});

// Invoice & Audit Log Endpoints (Sprint 3 Langkah 8)
app.get('/api/invoice/data', async (req, res) => {
  const txnId = parseInt(req.query.transactionId as string || '0');
  const result = await handleGetInvoiceData(txnId);
  res.status(result.success ? 200 : 404).json(result);
});

app.get('/api/invoice/audit-log', async (req, res) => {
  const { amlOnly, currencyCode, startDate, endDate, limit } = req.query as Record<string, string>;
  const result = await handleGetAuditLog({
    amlOnly: amlOnly === 'true',
    currencyCode,
    startDate,
    endDate,
    limit: limit ? parseInt(limit) : 100,
  });
  res.status(200).json(result);
});

app.get('/api/invoice/ppatk-report', async (_req, res) => {
  const result = await handleGetPpatkReport();
  res.status(200).json(result);
});

app.listen(port, () => {
  console.log(`🚀 [Dev Server] Running at http://localhost:${port}`);
  console.log(`📦 [DB Mode] ${process.env.DB_MODE || 'development'}`);
});
