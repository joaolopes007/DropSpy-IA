export enum View {
  LANDING = "LANDING",
  LOGIN = "LOGIN",
  REGISTER = "REGISTER",
  DASHBOARD = "DASHBOARD",
  EXPLORE = "EXPLORE",
  SAVED = "SAVED",
  PLANS = "PLANS",
  SETTINGS = "SETTINGS"
}

export interface Product {
  id: string;
  name: string;
  image: string; // Keeping for compatibility
  image_url: string; // Real marketplace URL
  costPrice: number;
  suggestedPrice: number;
  margin: number;
  competition: "Baixa" | "Média" | "Alta" | string;
  score: number;
  category: string;
  source: string; // Keeping for compatibility
  platform_source: "mercado_livre" | "shopee" | "amazon" | "aliexpress" | string;
  supplierUrl?: string;
  salesEstimation?: string;
  trendingTag?: string;
  demandLevel?: string;
  opportunityScore?: number;
  updatedAt?: string;
  trendStatus?: "up" | "down" | "stable";
  stock?: number;
  description?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  company?: string;
  document?: string;
  country?: string;
  timezone?: string;
  avatar_url?: string;
  subscription_active: boolean;
  subscription_status: 'active' | 'pending' | 'expired';
  subscription_expires_at?: string | null;
  security_alerts_enabled?: boolean;
  is_blocked?: boolean;
  dailyProductUsage?: number;
}
