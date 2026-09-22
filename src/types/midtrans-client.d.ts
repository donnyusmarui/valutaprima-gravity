// Type declaration for midtrans-client (no @types available)
declare module 'midtrans-client' {
  export class Snap {
    constructor(options: { isProduction: boolean; serverKey: string; clientKey: string });
    createTransaction(parameter: object): Promise<{ token: string; redirect_url: string }>;
  }
  export class CoreApi {
    constructor(options: { isProduction: boolean; serverKey: string; clientKey: string });
    transaction: {
      notification(body: object): Promise<{
        order_id: string;
        transaction_status: string;
        fraud_status?: string;
        gross_amount?: string;
      }>;
    };
  }
}
