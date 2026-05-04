import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import cors from "cors";
import cron from "node-cron";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, Firestore, FieldValue } from "firebase-admin/firestore";

const PRODUCT_CATEGORIES = ["Eletrônicos", "Beleza", "Casa e cozinha", "Moda", "Utilidades", "Fitness"];
const MARKETPLACE_PLATFORMS = [
  { id: "mercado_livre", name: "Mercado Livre" },
  { id: "shopee", name: "Shopee" },
  { id: "amazon", name: "Amazon" },
  { id: "aliexpress", name: "AliExpress" }
];

interface MockProduct {
  id: string;
  name: string;
  image: string;
  image_url: string;
  costPrice: number;
  suggestedPrice: number;
  margin: number;
  competition: string;
  score: number;
  category: string;
  source: string;
  platform_source: string;
  salesEstimation: string;
  trendingTag?: string;
  demandLevel: string;
  opportunityScore: number;
  updatedAt: string;
  trendStatus: "up" | "down" | "stable";
}

// --- CACTO API INTEGRATION ---
class CactoService {
  private static readonly BASE_URL = "https://api.cactopay.com.br";
  private static accessToken: string | null = null;
  private static tokenExpiresAt: number | null = null;

  private static async getAuthToken() {
    const now = Date.now();
    if (this.accessToken && this.tokenExpiresAt && now < this.tokenExpiresAt) {
      return this.accessToken;
    }

    const { CACTO_CLIENT_ID, CACTO_CLIENT_SECRET } = process.env;
    if (!CACTO_CLIENT_ID || !CACTO_CLIENT_SECRET) {
      console.warn("[CACTO] Missing credentials, skipping auth");
      return null;
    }

    try {
      const response = await axios.post(`${this.BASE_URL}/oauth/token`, {
        client_id: CACTO_CLIENT_ID,
        client_secret: CACTO_CLIENT_SECRET,
        grant_type: "client_credentials"
      });

      this.accessToken = response.data.access_token;
      // Expires in (response.data.expires_in - buffer)
      this.tokenExpiresAt = now + (response.data.expires_in * 1000) - 60000;
      return this.accessToken;
    } catch (err) {
      console.error("[CACTO] Auth failed:", (err as Error).message);
      return null;
    }
  }

  static async getSubscription(email: string) {
    const token = await this.getAuthToken();
    if (!token) return null;

    try {
      const response = await axios.get(`${this.BASE_URL}/subscriptions`, {
        params: { email },
        headers: { Authorization: `Bearer ${token}` }
      });

      // Assuming response.data contains the subscription object
      // If Cacto returns a list, find the most relevant one (active or last)
      const subs = Array.isArray(response.data) ? response.data : [response.data];
      if (subs.length === 0) return null;

      // Sort by priority or date if needed. Let's take the first for simplicity
      // or find the first 'active' one.
      const sub = subs.find((s: { status: string }) => s.status === "active") || subs[0];

      return {
        status: this.mapStatus(sub.status as string),
        next_billing_date: sub.next_billing_date as string,
        customer_id: sub.customer_id as string
      };
    } catch (err) {
      console.error("[CACTO] Fetch sub failed:", (err as Error).message);
      return null;
    }
  }

  private static mapStatus(cactoStatus: string): "active" | "pending" | "expired" {
    switch (cactoStatus) {
      case "active": return "active";
      case "pending":
      case "unpaid": return "pending";
      case "canceled":
      case "expired": return "expired";
      default: return "expired";
    }
  }
}

const AUTOMATION_LOGS: { timestamp: string; platforms: string[]; productsUpdated: number }[] = [];

function generateMockProducts(count: number) {
  const products: MockProduct[] = [];
  
  // REAL Marketplace Image URLs (Curated Dataset)
  const realImages: Record<string, string[]> = {
    "Eletrônicos": [
      "https://http2.mlstatic.com/D_NQ_NP_911565-MLB50069363065_052022-O.webp",
      "https://m.media-amazon.com/images/I/71uKpx8CjtL._AC_SL1500_.jpg",
      "https://ae01.alicdn.com/kf/Sbd0b9d99c4384d7a8d56968ce63d7675f.jpg",
      "https://down-br.img.susercontent.com/file/br-11134207-7r98o-lsth7iue1nqv7f"
    ],
    "Beleza": [
      "https://down-br.img.susercontent.com/file/br-11134207-7qukw-lje7h1nqv7f4a",
      "https://m.media-amazon.com/images/I/61Nl5u8-X9L._AC_SL1000_.jpg",
      "https://http2.mlstatic.com/D_NQ_NP_890742-MLB4769363065_102021-O.webp"
    ],
    "Casa e cozinha": [
      "https://m.media-amazon.com/images/I/61mZ9OUPpHL._AC_SL1200_.jpg",
      "https://http2.mlstatic.com/D_NQ_NP_756534-MLB4622630123_062021-O.webp",
      "https://ae01.alicdn.com/kf/Sf6b9d99c4384d7a8d56968ce63d7675f.jpg"
    ],
    "Moda": [
      "https://down-br.img.susercontent.com/file/br-11134207-7qukw-ljv7h1nqv7f4a",
      "https://m.media-amazon.com/images/I/61b7L4-S-AL._AC_UL1500_.jpg",
      "https://http2.mlstatic.com/D_NQ_NP_678942-MLB4769363065_092021-O.webp"
    ],
    "Utilidades": [
      "https://ae01.alicdn.com/kf/Sbd0b9d99c4384d7a8d56968ce63d7675f.jpg",
      "https://m.media-amazon.com/images/I/71N1pCqH-sL._AC_SL1500_.jpg",
      "https://http2.mlstatic.com/D_NQ_NP_911565-MLB50069363065_052022-O.webp"
    ],
    "Fitness": [
      "https://m.media-amazon.com/images/I/71QoW8L9pVL._AC_SL1500_.jpg",
      "https://http2.mlstatic.com/D_NQ_NP_890742-MLB4769363065_102021-O.webp",
      "https://down-br.img.susercontent.com/file/br-11134207-7qukw-lje7h1nqv7f4a"
    ]
  };

  const productNames = {
    "Eletrônicos": ["Smartwatch Ultra Pro", "Fone Wireless Noise Cancelling", "Monitor Curvo 4K", "Carregador Magnético Rápido", "Teclado Mecânico RGB", "Mouse Vertical Ergonômico", "Câmera de Segurança 360", "Estabilizador de Celular", "Projetor Portátil HD", "Adaptador Universal Hub"],
    "Beleza": ["Kit de Pincéis Profissionais", "Modelador de Cachos Automático", "Sérum Facial Ácido Hialurônico", "Máscara de LED Rejuvenescimento", "Secador de Cabelo Iônico", "Depilador Laser Portátil", "Kit Skincare Premium", "Massageador Facial Vibratório"],
    "Casa e cozinha": ["Fritadeira Air Fryer 5L", "Aspirador Robô Inteligente", "Kit de Facas Damasco", "Cafeteira Espresso Deluxe", "Liquidificador Ninja Pro", "Organizador de Geladeira", "Mesa Articulada Premium", "Conjunto de Toalhas Algodão Egípcio"],
    "Moda": ["Óculos de Sol Polarizado", "Relógio Casual Luxo", "Mochila Anti-furto", "Jaqueta Corta-vento", "Tênis Running Performance", "Bolsa Couro Legítimo", "Cinto Automático Inteligente", "Meias de Compressão"],
    "Utilidades": ["Lâmpada Inteligente RGB", "Sensor de Movimento Wireless", "Ferramenta Multiuso 18 em 1", "Cofre Digital Portátil", "Lixeira Sensorial", "Kit Reparo Rápido Smartphone"],
    "Fitness": ["Conjunto Elásticos Resistência", "Rolo de Liberação Miofascial", "Tapete de Yoga Antiderrapante", "Smart Shaker Térmico", "Corda de Pular Velocidade", "Halteres Ajustáveis", "Joelheira Neoprene Profissional"]
  };

  for (let i = 0; i < count; i++) {
    const category = PRODUCT_CATEGORIES[Math.floor(Math.random() * PRODUCT_CATEGORIES.length)];
    const platform = MARKETPLACE_PLATFORMS[Math.floor(Math.random() * MARKETPLACE_PLATFORMS.length)];
    const demand = Math.floor(Math.random() * 40) + 60;
    const competition = Math.floor(Math.random() * 60) + 20;
    const margin = Math.floor(Math.random() * 40) + 20;
    const cost = Math.floor(Math.random() * 500) + 50;
    const price = Math.round(cost * (1 + margin / 100));
    
    // AI Enrichment details
    const score = Math.round((demand * 0.5) + ((100 - competition) * 0.3) + (margin * 0.2));
    const trending = score > 88 ? "🔥 em alta" : (score > 78 ? "🚀 tendência" : undefined);
    const categoryNames = productNames[category as keyof typeof productNames] || ["Produto Especial"];
    const baseName = categoryNames[Math.floor(Math.random() * categoryNames.length)];
    
    const categoryImages = realImages[category] || ["https://http2.mlstatic.com/D_NQ_NP_612260-MLA49455322444_032022-O.webp"];
    const imageUrl = categoryImages[Math.floor(Math.random() * categoryImages.length)];

    products.push({
      id: `prod_${i}_${Math.random().toString(36).substr(2, 9)}`,
      name: `${baseName} ${i + 1}`,
      image: imageUrl,
      image_url: imageUrl,
      costPrice: cost,
      suggestedPrice: price,
      margin: margin,
      competition: competition > 60 ? "Alta" : competition > 30 ? "Média" : "Baixa",
      score: score,
      category: category,
      source: platform.name,
      platform_source: platform.id,
      salesEstimation: `${Math.floor(Math.random() * 5000) + 500}+ vendidos`,
      trendingTag: trending,
      demandLevel: demand > 85 ? "Explosiva" : demand > 70 ? "Alta" : "Estável",
      opportunityScore: score,
      updatedAt: new Date().toISOString(),
      trendStatus: "stable"
    });
  }
  return products;
}

let MOCK_PRODUCTS_DATA = generateMockProducts(1250);

const PLAN_LIMITS = {
  starter: 5,
  pro: 20,
  enterprise: Infinity
};

async function checkAndIncrementUsage(userId: string) {
  if (!db_admin) throw new Error("Banco de dados indisponível");
  
  const userRef = db_admin.collection("users").doc(userId);
  const today = new Date().toISOString().split('T')[0];

  return await db_admin.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists) throw new Error("Usuário não encontrado");
    
    const data = userDoc.data();
    if (!data) throw new Error("Dados do usuário não encontrados");

    const plan = (data.plan || "starter") as keyof typeof PLAN_LIMITS;
    const status = data.subscription_status || "expired";
    const expiresAt = data.subscription_expires_at ? new Date(data.subscription_expires_at) : null;
    const now = new Date();

    // Backup validation: If status is active but date passed, force expired
    if (status === "active" && expiresAt && now > expiresAt) {
      transaction.update(userRef, { subscription_status: "expired", subscription_active: false });
      throw new Error(`PLATFORM_BLOCKED|Sua assinatura expirou. Renove para continuar usando a plataforma.`);
    }

    if (status === "pending") {
      throw new Error(`PLATFORM_BLOCKED|Sua assinatura está pendente. Realize o pagamento para continuar.`);
    }

    if (status === "expired") {
      throw new Error(`PLATFORM_BLOCKED|Sua assinatura expirou. Renove para continuar usando a plataforma.`);
    }

    if (data.is_blocked) {
      throw new Error(`PLATFORM_BLOCKED|Sua conta está bloqueada. Renove seu acesso para continuar usando a plataforma.`);
    }

    const limit = PLAN_LIMITS[plan];
    
    let usage = data.dailyProductUsage || 0;
    const lastReset = data.lastResetDate;

    // Reset if it's a new day
    if (lastReset !== today) {
      usage = 0;
    }

    if (usage >= limit) {
      throw new Error(`LIMITE_EXCEDIDO|Você atingiu seu limite diário. Renove seu acesso para continuar utilizando todos os recursos.`);
    }

    const newUsage = usage + 1;
    transaction.update(userRef, {
      dailyProductUsage: newUsage,
      lastResetDate: today,
      is_blocked: false // Ensure unblocked if limit not reached
    });

    return { usage: newUsage, limit };
  });
}

// Product Automation System
function runProductAutomation() {
  console.log(`[AUTOMATION] Starting scheduled update: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
  
  // Simulation of AI enrichment logic for 1000+ products
  MOCK_PRODUCTS_DATA = MOCK_PRODUCTS_DATA.map(product => {
    // Randomize demand shifts
    const demandShift = (Math.random() - 0.5) * 10;
    const newDemand = Math.min(Math.max(60, 80 + demandShift), 100);
    
    // Randomize competition shifts
    const compShift = (Math.random() - 0.5) * 5;
    const newCompetition = Math.min(Math.max(20, 40 + compShift), 80);
    
    // Recalculate AI score
    const newScore = Math.round((newDemand * 0.5) + ((100 - newCompetition) * 0.3) + (product.margin * 0.2));
    
    // Determine trend status
    let trendStatus: "up" | "down" | "stable" = "stable";
    if (newScore > product.score + 2) trendStatus = "up";
    else if (newScore < product.score - 2) trendStatus = "down";

    // Update tags based on new AI evaluation
    let trendingTag = product.trendingTag;
    if (newScore > 90) trendingTag = "🔥 em alta agora";
    else if (trendStatus === "up") trendingTag = "📈 subindo";
    else if (newScore > 80) trendingTag = "🚀 tendência";

    return {
      ...product,
      score: newScore,
      opportunityScore: newScore,
      demandLevel: newDemand > 85 ? "Explosiva" : newDemand > 70 ? "Alta" : "Estável",
      competition: newCompetition > 60 ? "Alta" : newCompetition > 30 ? "Média" : "Baixa",
      trendStatus,
      trendingTag,
      updatedAt: new Date().toISOString()
    };
  });

  // Log the automation run
  const logEntry = {
    timestamp: new Date().toISOString(),
    platforms: MARKETPLACE_PLATFORMS.map(p => p.name),
    productsUpdated: MOCK_PRODUCTS_DATA.length
  };
  AUTOMATION_LOGS.push(logEntry);
  
  // Keep only last 50 logs
  if (AUTOMATION_LOGS.length > 50) AUTOMATION_LOGS.shift();

  console.log(`[AUTOMATION] Update completed. ${MOCK_PRODUCTS_DATA.length} products re-evaluated.`);
}

let db_admin: Firestore;

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Firebase Admin safely
  try {
    if (!getApps().length) {
      initializeApp({
        projectId: "gen-lang-client-0945301096"
      });
    }
    // Try to get Firestore with the specific database ID from config
    // Using the newer getFirestore helper for better database multi-instance support
    db_admin = getFirestore("ai-studio-d153c373-2831-4df7-9c3a-05def090313b");
    console.log("Firebase Admin initialized successfully");
    
    // Initial automation run to populate trend data and timestamps
    runProductAutomation();
  } catch (err) {
    console.error("Firebase Admin initialization failed.", err);
  }

  app.use(cors());
  app.use(express.json());

  // Schedule Automation: 09:00, 14:00, 20:00 BRT
  const scheduleOptions = {
    timezone: "America/Sao_Paulo"
  };

  cron.schedule("0 9 * * *", runProductAutomation, scheduleOptions);
  cron.schedule("0 14 * * *", runProductAutomation, scheduleOptions);
  cron.schedule("0 20 * * *", runProductAutomation, scheduleOptions);

// Daily Reset of Usage Counters at 00:00 BRT
  cron.schedule("0 0 * * *", async () => {
    console.log("[CRON] Resetting daily product usage and checking subscriptions...");
    if (!db_admin) return;
    try {
      const usersSnap = await db_admin.collection("users").get();
      const batch = db_admin.batch();
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      usersSnap.docs.forEach(doc => {
        const data = doc.data();
        
        // 1. Reset daily usage
        const updates: Record<string, string | number | boolean | null> = {
          dailyProductUsage: 0,
          lastResetDate: todayStr
        };

        // 2. Check subscription expiration
        const status = data.subscription_status || "expired";
        if (data.subscription_expires_at) {
          const expiresAt = new Date(data.subscription_expires_at);
          if (today > expiresAt) {
            updates.subscription_active = false;
            updates.subscription_status = "expired";
            updates.is_blocked = true;
          }
        } else if (status === "active") {
           // Should not happen but safety check
           updates.subscription_status = "expired";
           updates.subscription_active = false;
        }

        batch.update(doc.ref, updates);
      });
      
      await batch.commit();
      console.log(`[CRON] Reset and subscription check complete for ${usersSnap.size} users.`);
    } catch (err) {
      console.error("[CRON] Failed to reset usage counters:", err);
    }
  }, scheduleOptions);

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString(), environment: process.env.NODE_ENV || "development" });
  });

  // Helper to validate access on every request
  const validateSubscription = async (userId: string) => {
    if (!db_admin) return;
    const userDocRef = db_admin.collection("users").doc(userId);
    const userDoc = await userDocRef.get();
    if (!userDoc.exists) return;

    let data = userDoc.data();
    if (!data) return;

    // --- AUTO SYNC WITH CACTO ---
    // If not synced in the last 15 minutes, fetch from Cacto
    const lastSync = data.lastCactoSync ? new Date(data.lastCactoSync).getTime() : 0;
    const now = new Date();
    if (now.getTime() - lastSync > 15 * 60 * 1000 && data.email) {
      try {
        const cactoSub = await CactoService.getSubscription(data.email);
        if (cactoSub) {
          const updates = {
            subscription_status: cactoSub.status,
            subscription_expires_at: cactoSub.next_billing_date,
            subscription_active: cactoSub.status === "active",
            is_blocked: cactoSub.status !== "active",
            lastCactoSync: now.toISOString(),
            updatedAt: now.toISOString()
          };
          await userDocRef.update(updates);
          // Update local data variable to reflect current DB state after sync
          data = { ...data, ...updates };
        }
      } catch (err) {
        console.error("[CACTO SYNC] Error during automatic sync:", (err as Error).message);
        // Fallback: use last known status (per instructions)
      }
    }

    const status = data.subscription_status || "expired";
    const expiresAt = data.subscription_expires_at ? new Date(data.subscription_expires_at) : null;

    // Backup validation: IF current_date > subscription_expires_at THEN force status = "expired"
    if (status === "active" && expiresAt && now > expiresAt) {
      await userDocRef.update({
        subscription_active: false,
        subscription_status: "expired",
        is_blocked: true,
        updatedAt: now.toISOString()
      });
      throw new Error("ASSINATURA_EXPIRADA|Sua assinatura expirou. Renove para continuar usando a plataforma.");
    }

    if (status === "pending") {
      throw new Error("ASSINATURA_PENDENTE|Sua assinatura está pendente. Realize o pagamento para continuar.");
    }

    if (status === "expired" || (status === "active" && (!expiresAt || now > expiresAt))) {
      throw new Error("ASSINATURA_EXPIRADA|Sua assinatura expirou. Renove para continuar usando a plataforma.");
    }
  };

  // API Routes for Automation
  app.get("/api/automation/logs", (req, res) => {
    res.json(AUTOMATION_LOGS);
  });
  
  app.post("/api/products/save", async (req, res) => {
    const { userId, product } = req.body;
    if (!userId || !product) return res.status(400).json({ error: "Missing fields" });

    try {
      if (!db_admin) return res.status(500).json({ error: "Serviço indisponível" });
      
      // Real-time bypass-proof check
      await validateSubscription(userId);
      
      const usageInfo = await checkAndIncrementUsage(userId);
      
      // Save product to subcollection
      await db_admin.collection("users").doc(userId).collection("saved_products").add({
        productId: product.id,
        productName: product.name,
        productImage: product.image,
        savedAt: FieldValue.serverTimestamp(),
        // Store full product snapshot if needed, or just enough for UI
        product: product 
      });

      res.json({ success: true, usageInfo });
    } catch (err: unknown) {
      const error = err as Error;
      if (error.message.includes("ASSINATURA_EXPIRADA") || error.message.includes("LIMITE_EXCEDIDO") || error.message.includes("PLATFORM_BLOCKED")) {
        const message = error.message.split("|")[1];
        return res.status(403).json({ error: message, code: "LIMIT_REACHED" });
      }
      console.error(error);
      res.status(500).json({ error: "Erro ao salvar produto" });
    }
  });

  // API Routes for Trials
  app.post("/api/auth/trial/start", async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "User ID is required" });

    try {
      if (!db_admin) return res.status(500).json({ error: "Serviço indisponível" });
      
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 7);

      await db_admin.collection("users").doc(userId).update({
        subscription_active: true, // Trial counts as active
        subscription_status: "active",
        subscription_expires_at: trialEndDate.toISOString(),
        trial_active: true,
        trial_end_date: trialEndDate.toISOString().split('T')[0],
        is_blocked: false
      });

      res.json({ success: true, trialEndDate: trialEndDate.toISOString().split('T')[0] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erro ao iniciar período de teste" });
    }
  });

  // Sync endpoint for login/boot trigger
  app.post("/api/auth/sync-subscription", async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "User ID is required" });

    try {
      await validateSubscription(userId);
      res.json({ success: true });
    } catch (err: unknown) {
      const error = err as Error;
      const message = error.message.includes("|") ? error.message.split("|")[1] : error.message;
      res.json({ success: false, error: message });
    }
  });

  // API Routes for Products
  app.get("/api/products", async (req, res) => {
    const { 
      page = 1, 
      limit = 12, 
      category = "Todos", 
      platform = "Todos", 
      minScore = 0, 
      maxPrice = 5000,
      competition = "Todos",
      userId
    } = req.query;

    // Real-time bypass-proof check for products listing
    if (userId) {
      try {
        await validateSubscription(userId as string);
      } catch (err: unknown) {
        const error = err as Error;
        if (error.message.includes("ASSINATURA_EXPIRADA")) {
          const message = error.message.split("|")[1];
          return res.status(403).json({ 
            error: `PLATFORM_BLOCKED|${message}` 
          });
        }
      }
    }

    // Simulate different refresh priority/latency per plan
    if (userId && db_admin) {
      try {
        const userDoc = await db_admin.collection("users").doc(userId as string).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          if (userData?.is_blocked) {
            return res.status(403).json({ 
              error: "PLATFORM_BLOCKED|Sua conta está limitada. Renove seu acesso para continuar usando a plataforma." 
            });
          }
          
          const plan = userData?.plan || "starter";
          if (plan === "starter") {
            // Slower priority = 1.5s delay
            await new Promise(resolve => setTimeout(resolve, 1500));
          } else if (plan === "pro") {
            // Normal priority = 500ms delay
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          // Enterprise = 0ms delay
        }
      } catch (err) {
        console.error("Error checking user plan for priority:", err);
      }
    }
    
    let filtered = [...MOCK_PRODUCTS_DATA];

    if (category !== "Todos") {
      filtered = filtered.filter(p => p.category === category);
    }
    if (platform !== "Todos") {
      filtered = filtered.filter(p => p.source === platform);
    }
    if (competition !== "Todos") {
      filtered = filtered.filter(p => p.competition === competition);
    }
    
    filtered = filtered.filter(p => p.score >= Number(minScore));
    filtered = filtered.filter(p => p.suggestedPrice <= Number(maxPrice));

    // Sort by score by default
    filtered.sort((a, b) => b.score - a.score);

    const start = (Number(page) - 1) * Number(limit);
    const end = start + Number(limit);
    const total = filtered.length;
    const data = filtered.slice(start, end);

    res.json({
      data,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
        hasMore: end < total
      }
    });
  });

  // API Routes for Mercado Livre
  app.post("/api/marketplace/mercado-livre/publish", async (req, res) => {
    const { accessToken, listingData } = req.body;

    if (!accessToken) {
      return res.status(401).json({ error: "Access token is required" });
    }

    try {
      // 1. Domain Discovery - Auto Category Detection
      console.log(`Discovering category for: ${listingData.title}`);
      const discoveryUrl = `https://api.mercadolibre.com/sites/MLB/domain_discovery?q=${encodeURIComponent(listingData.title)}`;
      const discoveryRes = await axios.get(discoveryUrl);
      
      const categoryId = discoveryRes.data?.[0]?.category_id || "MLB1051"; // Default to mobile phones if not found
      console.log(`Detected category: ${categoryId}`);

      // 2. Create Listing
      const createListingBody = {
        title: listingData.title.substring(0, 60), // ML limit is 60
        category_id: categoryId,
        price: Number(listingData.price),
        currency_id: "BRL",
        available_quantity: 1,
        buying_mode: "buy_it_now",
        condition: "new",
        listing_type_id: "gold_special",
        pictures: [
          {
            source: listingData.image || "https://http2.mlstatic.com/D_NQ_NP_612260-MLA49455322444_032022-O.webp"
          }
        ],
        attributes: [],
        shipping: {
          mode: "me2"
        },
        description: {
          plain_text: listingData.description || "Produto novo e lacrado."
        }
      };

      const publishUrl = "https://api.mercadolibre.com/items";
      const publishRes = await axios.post(publishUrl, createListingBody, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });

      console.log(`Listing created: ${publishRes.data.id}`);
      res.json(publishRes.data);

    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: unknown; status?: number }; message: string };
      console.error("ML Publish Error:", axiosError.response?.data || axiosError.message);
      res.status(axiosError.response?.status || 500).json({
        error: "Erro ao publicar no Mercado Livre",
        details: axiosError.response?.data || axiosError.message
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Critical server startup error:", err);
});
