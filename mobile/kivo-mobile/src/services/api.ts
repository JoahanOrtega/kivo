// =============================================================================
// services/api.ts — Cliente HTTP para el backend de Kivo
//
// Centraliza todas las llamadas al backend en un solo lugar.
// Maneja automáticamente:
// - El token JWT en cada request autenticado
// - Los errores de red y de servidor
// - La URL base del backend
// =============================================================================

import * as SecureStore from "expo-secure-store";

// ─── URL base del backend ─────────────────────────────────────────────────────
// En desarrollo apunta a localhost. En producción se cambia por la URL real.
// EXPO_PUBLIC_ hace que la variable sea accesible en el cliente.
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8080";

// ─── Tipos de error de la API ─────────────────────────────────────────────────
export class ApiError extends Error {
    constructor(
        public statusCode: number,
        message: string
    ) {
        super(message);
        this.name = "ApiError";
    }
}

// ─── Helper: obtener token del SecureStore ────────────────────────────────────
// Lee el JWT guardado al hacer login para incluirlo en cada request.
async function getAuthToken(): Promise<string | null> {
    try {
        const session = await SecureStore.getItemAsync("kivo.auth.session");
        if (!session) return null;
        const parsed = JSON.parse(session);
        return parsed.accessToken ?? null;
    } catch {
        return null;
    }
}

// ─── Helper: construir headers ────────────────────────────────────────────────
async function buildHeaders(authenticated: boolean): Promise<HeadersInit> {
    const headers: HeadersInit = {
        "Content-Type": "application/json",
    };

    if (authenticated) {
        const token = await getAuthToken();
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
    }

    return headers;
}

// ─── Helper: procesar respuesta ───────────────────────────────────────────────
// Lanza ApiError si el servidor retorna un código de error.
async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new ApiError(
            response.status,
            body.error ?? `Error ${response.status}`
        );
    }
    return response.json() as Promise<T>;
}

// =============================================================================
// Funciones públicas de la API
// =============================================================================

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface RegisterDto {
    email: string;
    password: string;
    full_name: string;
}

export interface LoginDto {
    email: string;
    password: string;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
    user: {
        id: string;
        email: string;
        full_name: string;
    };
}

export async function register(dto: RegisterDto): Promise<AuthResponse> {
    const response = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: await buildHeaders(false),
        body: JSON.stringify(dto),
    });
    return handleResponse<AuthResponse>(response);
}

export async function login(dto: LoginDto): Promise<AuthResponse> {
    const response = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: await buildHeaders(false),
        body: JSON.stringify(dto),
    });
    return handleResponse<AuthResponse>(response);
}

// ─── Transacciones ────────────────────────────────────────────────────────────

export interface CreateTransactionPayload {
    id: string;
    category_id: string;
    payment_method_id?: string;
    transaction_date: string;
    type: string;
    concept?: string;
    amount: number;
    budgeted_amount?: number;
    notes?: string;
}

export async function getTransactions(year: number, month: number) {
    const response = await fetch(
        `${BASE_URL}/transactions?year=${year}&month=${month}`,
        { headers: await buildHeaders(true) }
    );
    return handleResponse<CreateTransactionPayload[]>(response);
}

export async function createTransactionRemote(payload: CreateTransactionPayload) {
    const response = await fetch(`${BASE_URL}/transactions`, {
        method: "POST",
        headers: await buildHeaders(true),
        body: JSON.stringify({ ...payload, type_: payload.type }),
    });
    return handleResponse(response);
}

// ─── Sync ─────────────────────────────────────────────────────────────────────

export interface SyncItem {
    operation: "create" | "update" | "delete";
    id: string;
    category_id?: string;
    payment_method_id?: string;
    transaction_date?: string;
    type?: string;
    concept?: string;
    amount?: number;
    budgeted_amount?: number;
    notes?: string;
}

export interface SyncPayload {
    transactions: SyncItem[];
}

export interface SyncResponse {
    synced: number;
    errors: { id: string; message: string }[];
}

export async function syncToServer(payload: SyncPayload): Promise<SyncResponse> {
    const response = await fetch(`${BASE_URL}/sync`, {
        method: "POST",
        headers: await buildHeaders(true),
        body: JSON.stringify(payload),
    });
    return handleResponse<SyncResponse>(response);
}

// ─── Categorías ───────────────────────────────────────────────────────────────

export async function getCategories() {
    const response = await fetch(`${BASE_URL}/categories`, {
        headers: await buildHeaders(true),
    });
    return handleResponse(response);
}

// ─── Métodos de pago ──────────────────────────────────────────────────────────

export async function getPaymentMethods() {
    const response = await fetch(`${BASE_URL}/payment-methods`, {
        headers: await buildHeaders(true),
    });
    return handleResponse(response);
}

// ─── Tipos de reporte mensual ─────────────────────────────────────────────────
export interface MonthlyCategorySummary {
    category_id: string;
    category_name: string;
    category_type: string;
    total: number;
    count: number;
}

export interface MonthlyPaymentMethodSummary {
    payment_method_id: string | null;
    payment_method_name: string;
    total: number;
    count: number;
}

export interface MonthlyReportData {
    year: number;
    month: number;
    total_income: number;
    total_expense: number;
    total_savings: number;
    balance: number;
    transaction_count: number;
    by_category: MonthlyCategorySummary[];
    by_payment_method: MonthlyPaymentMethodSummary[];
}

export async function getMonthlyReport(
    year: number,
    month: number
): Promise<MonthlyReportData> {
    const response = await fetch(
        `${BASE_URL}/reports/monthly?year=${year}&month=${month}`,
        { headers: await buildHeaders(true) }
    );
    return handleResponse<MonthlyReportData>(response);
}

// ─── Tipos de tendencia ───────────────────────────────────────────────────────
export interface TrendMonth {
    year: number;
    month: number;
    total_income: number;
    total_expense: number;
    total_savings: number;
    balance: number;
}

export async function getReportsTrend(
    year: number,
    month: number,
    months: number = 6
): Promise<TrendMonth[]> {
    const response = await fetch(
        `${BASE_URL}/reports/trend?year=${year}&month=${month}&months=${months}`,
        { headers: await buildHeaders(true) }
    );
    return handleResponse<TrendMonth[]>(response);
}