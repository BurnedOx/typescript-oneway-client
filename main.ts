import axios, { AxiosError, AxiosInstance, AxiosResponse } from "axios";
import * as jwt from "jsonwebtoken";
import { enc, HmacSHA256 } from "crypto-js";

export interface OnepayResponse<T = any> {
  status: string;
  code: number;
  msg: string;
  data: T;
}

export class OnepayException extends Error {
  constructor(public code: number, public message: string) {
    super(`[${code}] ${message}`);
  }
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
  provider: "stripe" | "razorpay" | "billdesk";
  amount: number;
  currency: string;
  return_url: string;
  ip: string;
  user_agent: string;
  meta_data?: Record<string, any> | null;
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
  status:
    | "pending"
    | "success"
    | "failed"
    | "processing"
    | "refunded"
    | "cancelled";
  renew_id: string | null;
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
}

export interface PaymentProvider {
  id: string;
  name: string;
  slug: "stripe" | "razorpay" | "billdesk";
  logo: string | null;
  description: string | null;
  is_recommended: boolean;
}

export function decodeWebhookPayload(payload: string, signature: string) {
  try {
    const decoded = jwt.verify(payload, signature, { algorithms: ["HS256"] });
    return decoded as PaymentIntent;
  } catch (err) {
    throw new OnepayException(400, "Invalid webhook signature");
  }
}

export default class OnepayClient {
  private readonly http: AxiosInstance;

  constructor(
    private readonly domain: string,
    private readonly apiKey: string,
    private readonly secretKey: string,
    private readonly timeout: number = 30
  ) {
    this.http = axios.create({
      baseURL: this.domain,
      timeout: this.timeout,
      headers: {
        "Content-Type": "application/json",
        "X-ACCESS-KEY": this.apiKey,
      },
    });

    this.http.interceptors.request.use((config) => {
      const time = Date.now().toString();
      const token = enc.Base64.stringify(HmacSHA256(time, this.secretKey));
      config.headers.set("X-ACCESS-TOKEN", `${time}:${token}`);
      return config;
    });

    this.http.interceptors.response.use(
      (res: AxiosResponse<OnepayResponse>) => {
        if (!res.data) {
          throw new OnepayException(500, "No data received from OnePay API");
        } else if (res.data.status !== "success") {
          throw new OnepayException(
            res.data.code,
            res.data.msg || "Unknown error"
          );
        } else {
          return res;
        }
      },
      (error: AxiosError<OnepayResponse>) => {
        const data = error.response?.data;
        if (data) {
          throw new OnepayException(data.code, data.msg || "Unknown error");
        } else {
          throw new OnepayException(500, "No data received from OnePay API");
        }
      }
    );
  }

  public async createContact(data: ContactPayload): Promise<string> {
    const res = await this.http.post<OnepayResponse<{ contact_id: string }>>(
      "/v1/contacts",
      { ...data }
    );
    return res.data.data.contact_id;
  }

  public async updateContact(
    contactId: string,
    data: ContactPayload
  ): Promise<void> {
    const payload: ContactPayload = {};

    if (typeof data.name === "string") payload.name = data.name;
    if (typeof data.phone === "string") payload.phone = data.phone;
    if (typeof data.email === "string") payload.email = data.email;
    if (typeof data.street === "string") payload.street = data.street;
    if (typeof data.city === "string") payload.city = data.city;
    if (typeof data.state === "string") payload.state = data.state;
    if (typeof data.zip_code === "string") payload.zip_code = data.zip_code;
    if (typeof data.country === "string") payload.country = data.country;

    await this.http.put(`/v1/contacts/${contactId}`, payload);
  }

  public async getProviders(ip: string) {
    const res = await this.http.get<OnepayResponse<PaymentProvider[]>>(
      `/v1/payments/providers?ip=${ip}`
    );
    return res.data.data;
  }

  public async createPayment(data: PaymentPayload) {
    const res = await this.http.post<OnepayResponse<PaymentLink>>(
      "/v1/payments/intent",
      { ...data }
    );
    return res.data.data;
  }

  public async getPayment(paymentId: string) {
    const res = await this.http.get<OnepayResponse<PaymentIntent>>(
      `/v1/payments/intent/${paymentId}`
    );
    return res.data.data;
  }
}
