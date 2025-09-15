export interface OnepayResponse<T = any> {
    status: string;
    code: number;
    msg: string;
    data: T;
}
export declare class OnepayException extends Error {
    code: number;
    message: string;
    constructor(code: number, message: string);
}
export interface ContactPayload {
    name?: string;
    phone?: string;
    email?: string;
    street?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    country?: string;
}
export interface PaymentPayload {
    contact_id: string;
    provider: "stripe" | "razorpay" | "billdesk" | "xendit";
    amount: number;
    currency: string;
    return_url: string;
    ip: string;
    user_agent: string;
    country_code?: string;
    meta_data?: Record<string, any> | null;
    recurring_conf?: {
        interval?: "DAY" | "WEEK" | "MONTH";
        interval_count?: number;
        total_recurrence?: number;
    };
}
export interface PaymentIntent {
    id: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    invoice_number: string | null;
    trx_id: string | null;
    amount: number;
    currency: string;
    return_url: string | null;
    payment_method: string | null;
    status: "pending" | "success" | "failed" | "processing" | "refunded" | "cancelled";
    renew_id: string | null;
    subscription_status: "active" | "inactive" | null;
    next_billing_date: string | null;
    provider_id: string;
    contact_id: string;
    merchant_id: string;
    ip: string | null;
    user_agent: string | null;
    meta_data: object | null;
    payment_intent: object | null;
    logs: object | null;
}
export interface PaymentLink {
    payment_id: string;
    link: string;
    recurring: boolean;
    payment_intent: PaymentIntent;
}
export interface PaymentProvider {
    id: string;
    name: string;
    slug: "stripe" | "razorpay" | "billdesk" | "xendit";
    logo: string | null;
    description: string | null;
    is_recommended: boolean;
}
export declare function decodeWebhookPayload(payload: string, signature: string): PaymentIntent;
export default class OnepayClient {
    private readonly domain;
    private readonly apiKey;
    private readonly secretKey;
    private readonly timeout;
    private readonly http;
    constructor(domain: string, apiKey: string, secretKey: string, timeout?: number);
    createContact(data: ContactPayload): Promise<string>;
    updateContact(contactId: string, data: ContactPayload): Promise<void>;
    getProviders(ip?: string, countryCode?: string): Promise<PaymentProvider[]>;
    createPayment(data: PaymentPayload): Promise<PaymentLink>;
    getPayment(paymentId: string): Promise<PaymentIntent>;
}
