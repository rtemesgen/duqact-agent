import type { ApiConnection, ChangePasswordRequest, ChannelType, CurrencyProfile, DashboardStats, ExchangeRate, MnoAccount, MnoTransaction, MnoWallet, MobiAgentShop, Role, ServiceChannel, Session, ShopWorkerAssignment, User, UserProfile, UserSettings } from './types';

declare global {
  interface Window {
    __APP_CONFIG__?: { VITE_API_URL?: string };
  }
}

const runtimeApiUrl = window.__APP_CONFIG__?.VITE_API_URL;
const API_URL = runtimeApiUrl && runtimeApiUrl !== '${VITE_API_URL}' ? runtimeApiUrl : (import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api');
let token = localStorage.getItem('mobi_token') ?? '';

export function setToken(next: string) {
  token = next;
  next ? localStorage.setItem('mobi_token', next) : localStorage.removeItem('mobi_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error((await res.text()) || res.statusText);
  if (res.status === 204) return undefined as T;
  return res.json();
}

const body = (value: unknown) => JSON.stringify(value);

export const api = {
  login: (email: string, password: string) => request<Session>('/auth/login', { method: 'POST', body: body({ email, password }) }),
  register: (name: string, email: string, password: string) => request<Session>('/auth/register', { method: 'POST', body: body({ name, email, password }) }),
  users: () => request<User[]>('/users'),
  setRole: (id: number, role: Role) => request<User>(`/users/${id}/role`, { method: 'PATCH', body: body({ role }) }),
  accounts: () => request<MnoAccount[]>('/mno-accounts'),
  saveAccount: (item: MnoAccount) => request<MnoAccount>(item.id ? `/mno-accounts/${item.id}` : '/mno-accounts', { method: item.id ? 'PUT' : 'POST', body: body(item) }),
  deleteAccount: (id: number) => request<void>(`/mno-accounts/${id}`, { method: 'DELETE' }),
  wallets: () => request<MnoWallet[]>('/mno-wallets'),
  saveWallet: (item: MnoWallet) => request<MnoWallet>(item.id ? `/mno-wallets/${item.id}` : '/mno-wallets', { method: item.id ? 'PUT' : 'POST', body: body(item) }),
  deleteWallet: (id: number) => request<void>(`/mno-wallets/${id}`, { method: 'DELETE' }),
  transactions: () => request<MnoTransaction[]>('/mno-transactions'),
  recordTransaction: (item: { walletId: number; transactionType: string; amount: number; agentNumber: string; clientPhone: string; clientName: string }) => request<MnoTransaction>('/mno-transactions', { method: 'POST', body: body(item) }),
  rates: () => request<ExchangeRate[]>('/exchange-rates'),
  saveRate: (item: ExchangeRate) => request<ExchangeRate>(item.id ? `/exchange-rates/${item.id}` : '/exchange-rates', { method: item.id ? 'PUT' : 'POST', body: body(item) }),
  deleteRate: (id: number) => request<void>(`/exchange-rates/${id}`, { method: 'DELETE' }),
  currencyProfiles: () => request<CurrencyProfile[]>('/exchange-rates/profiles'),
  saveCurrencyProfile: (item: CurrencyProfile) => request<CurrencyProfile>(item.id ? `/exchange-rates/profiles/${item.id}` : '/exchange-rates/profiles', { method: item.id ? 'PUT' : 'POST', body: body(item) }),
  deleteCurrencyProfile: (id: number) => request<void>(`/exchange-rates/profiles/${id}`, { method: 'DELETE' }),
  dashboard: () => request<DashboardStats>('/dashboard/mobi-agent'),
  channelTypes: () => request<ChannelType[]>('/channels/types'),
  saveChannelType: (item: ChannelType) => request<ChannelType>(item.id ? `/channels/types/${item.id}` : '/channels/types', { method: item.id ? 'PUT' : 'POST', body: body(item) }),
  deleteChannelType: (id: number) => request<void>(`/channels/types/${id}`, { method: 'DELETE' }),
  serviceChannels: () => request<ServiceChannel[]>('/channels/service-channels'),
  saveServiceChannel: (item: ServiceChannel) => request<ServiceChannel>(item.id ? `/channels/service-channels/${item.id}` : '/channels/service-channels', { method: item.id ? 'PUT' : 'POST', body: body(item) }),
  deleteServiceChannel: (id: number) => request<void>(`/channels/service-channels/${id}`, { method: 'DELETE' }),
  apiConnections: () => request<ApiConnection[]>('/api-connections'),
  saveApiConnection: (item: ApiConnection) => request<ApiConnection>(item.id ? `/api-connections/${item.id}` : '/api-connections', { method: item.id ? 'PUT' : 'POST', body: body(item) }),
  deleteApiConnection: (id: number) => request<void>(`/api-connections/${id}`, { method: 'DELETE' }),
  shops: () => request<MobiAgentShop[]>('/shops'),
  saveShop: (item: MobiAgentShop) => request<MobiAgentShop>(item.id ? `/shops/${item.id}` : '/shops', { method: item.id ? 'PUT' : 'POST', body: body(item) }),
  deleteShop: (id: number) => request<void>(`/shops/${id}`, { method: 'DELETE' }),
  shopWorkers: (shopId: number) => request<ShopWorkerAssignment[]>(`/shops/${shopId}/workers`),
  assignShopWorker: (shopId: number, item: { userId: number; jobTitle: string; phone: string }) => request<ShopWorkerAssignment>(`/shops/${shopId}/workers`, { method: 'POST', body: body(item) }),
  removeShopWorker: (shopId: number, assignmentId: number) => request<void>(`/shops/${shopId}/workers/${assignmentId}`, { method: 'DELETE' }),
  profileMe: () => request<UserProfile>('/profile/me'),
  saveProfileMe: (item: UserProfile) => request<UserProfile>('/profile/me', { method: 'PUT', body: body(item) }),
  settingsMe: () => request<UserSettings>('/settings/me'),
  saveSettingsMe: (item: UserSettings) => request<UserSettings>('/settings/me', { method: 'PUT', body: body(item) }),
  changePassword: (item: ChangePasswordRequest) => request<void>('/settings/change-password', { method: 'POST', body: body(item) }),
};
