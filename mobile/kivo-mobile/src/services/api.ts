// =============================================================================
// services/api.ts — Cliente HTTP para el backend de Kivo
//
// Centraliza todas las llamadas al backend en un solo lugar.
// Maneja automáticamente:
// - El token JWT en cada request autenticado
// - Los errores de red y de servidor
// - La URL base del backend
// =============================================================================

import { AuthSession } from "@/types/auth";
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

// ─── Helper: verificar si el token está por expirar ──────────────────────────
// Decodifica el JWT sin verificar la firma para leer la fecha de expiración.
// Si expira en menos de 5 minutos, lo consideramos expirado.
function isTokenExpired(token: string): boolean {
    try {
        const payload = token.split(".")[1];
        const decoded = JSON.parse(atob(payload));
        const expiresAt = decoded.exp * 1000;
        const fiveMinutes = 5 * 60 * 1000;
        return Date.now() > expiresAt - fiveMinutes;
    } catch {
        return true;
    }
}

// ─── Helper: obtener token válido ─────────────────────────────────────────────
// Si el access token está por expirar, usa el refresh token para obtener uno nuevo.
// Si el refresh también falla, retorna null — el usuario deberá hacer login.
async function getValidToken(): Promise<string | null> {
    try {
        const session = await SecureStore.getItemAsync("kivo.auth.session");
        if (!session) return null;

        const parsed: AuthSession = JSON.parse(session);
        const { accessToken, refreshToken } = parsed;

        // Si el token sigue vigente lo usamos directamente
        if (!isTokenExpired(accessToken)) {
            return accessToken;
        }

        // Token expirado — intentamos renovarlo con el refresh token
        if (!refreshToken) return null;

        const newAccessToken = await refreshAccessToken(refreshToken);
        if (!newAccessToken) return null;

        // Guardamos el nuevo access token en SecureStore
        const updatedSession = { ...parsed, accessToken: newAccessToken };
        await SecureStore.setItemAsync("kivo.auth.session", JSON.stringify(updatedSession));

        return newAccessToken;
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
        const token = await getValidToken();
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
    }

    return headers;
}
// ─── Refresh token ────────────────────────────────────────────────────────────
export async function refreshAccessToken(refreshToken: string): Promise<string | null> {
    try {
        const response = await fetch(`${BASE_URL}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (!response.ok) return null;

        const data = await response.json();
        return data.access_token ?? null;
    } catch {
        return null;
    }
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
    refresh_token: string; 
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