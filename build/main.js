"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnepayException = void 0;
exports.decodeWebhookPayload = decodeWebhookPayload;
const axios_1 = __importDefault(require("axios"));
const jwt = __importStar(require("jsonwebtoken"));
const crypto_js_1 = require("crypto-js");
class OnepayException extends Error {
    constructor(code, message) {
        super(`[${code}] ${message}`);
        this.code = code;
        this.message = message;
    }
}
exports.OnepayException = OnepayException;
function decodeWebhookPayload(payload, signature) {
    try {
        const decoded = jwt.verify(payload, signature, { algorithms: ["HS256"] });
        return decoded;
    }
    catch (err) {
        throw new OnepayException(400, "Invalid webhook signature");
    }
}
class OnepayClient {
    constructor(domain, apiKey, secretKey, timeout = 30) {
        this.domain = domain;
        this.apiKey = apiKey;
        this.secretKey = secretKey;
        this.timeout = timeout;
        this.http = axios_1.default.create({
            baseURL: this.domain,
            timeout: this.timeout,
            headers: {
                "Content-Type": "application/json",
                "X-ACCESS-KEY": this.apiKey,
            },
        });
        this.http.interceptors.request.use((config) => {
            const time = Date.now().toString();
            const token = crypto_js_1.enc.Base64.stringify((0, crypto_js_1.HmacSHA256)(time, this.secretKey));
            config.headers.set("X-ACCESS-TOKEN", `${time}:${token}`);
            return config;
        });
        this.http.interceptors.response.use((res) => {
            if (!res.data) {
                throw new OnepayException(500, "No data received from OnePay API");
            }
            else if (res.data.status !== "success") {
                throw new OnepayException(res.data.code, res.data.msg || "Unknown error");
            }
            else {
                return res;
            }
        }, (error) => {
            var _a;
            const data = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data;
            if (data) {
                throw new OnepayException(data.code, data.msg || "Unknown error");
            }
            else {
                throw new OnepayException(500, "No data received from OnePay API");
            }
        });
    }
    createContact(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.http.post("/v1/contacts", Object.assign({}, data));
            return res.data.data.contact_id;
        });
    }
    updateContact(contactId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const payload = {};
            if (typeof data.name === "string")
                payload.name = data.name;
            if (typeof data.phone === "string")
                payload.phone = data.phone;
            if (typeof data.email === "string")
                payload.email = data.email;
            if (typeof data.street === "string")
                payload.street = data.street;
            if (typeof data.city === "string")
                payload.city = data.city;
            if (typeof data.state === "string")
                payload.state = data.state;
            if (typeof data.zip_code === "string")
                payload.zip_code = data.zip_code;
            if (typeof data.country === "string")
                payload.country = data.country;
            yield this.http.put(`/v1/contacts/${contactId}`, payload);
        });
    }
    getProviders(ip, countryCode) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.http.get("/v1/payments/providers", {
                params: {
                    ip,
                    country_code: countryCode,
                },
            });
            return res.data.data;
        });
    }
    createPayment(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.http.post("/v1/payments/intent", Object.assign({}, data));
            return res.data.data;
        });
    }
    getPayment(paymentId) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.http.get(`/v1/payments/intent/${paymentId}`);
            return res.data.data;
        });
    }
}
exports.default = OnepayClient;
//# sourceMappingURL=main.js.map