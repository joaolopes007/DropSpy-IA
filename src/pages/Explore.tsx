import { useState, useMemo, Fragment } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Check, Search, Zap, Send, X, TrendingUp, Filter, AlertCircle, ArrowUp, ArrowDown, Package } from "lucide-react";
import { useSaveProduct, useSavedProducts, useDiscoverProducts, useCreateManualProduct, useOwnProducts } from "../hooks/useProducts";
import { useGenerateListing, usePublishListing } from "../hooks/useListings";
import { useIntegrations } from "../hooks/useIntegrations";
import { Product } from "../types";
import { formatCurrency } from "../lib/formatters";

import { useAuth } from "../hooks/useAuth";
import { Link } from "react-router-dom";
import { logActivity } from "../hooks/useActivityLogs";

const CATEGORIES = ["Todos", "Eletrônicos", "Beleza", "Casa", "Moda", "Utilidades", "Outros"];
const COMPETITION_LEVELS = ["Todos", "Baixa", "Média", "Alta"];
const PLATFORMS = ["Todos", "Mercado Livre", "Shopee", "Amazon", "AliExpress"];

export const Explore = () => {
  const { profile } = useAuth();
  const { data: integrations = [] } = useIntegrations();
  
  const [page, setPage] = useState(1);
  const [filterCategory, setFilterCategory] = useState("Todos");
  const [filterComp, setFilterComp] = useState("Todos");
  const [filterPlatform, setFilterPlatform] = useState("Todos");
  const [minScore, setMinScore] = useState(0);
  const [maxPrice, setMaxPrice] = useState(5000);

  const { 
    data: productsResponse, 
    isLoading: isLoadingDiscovery, 
    isFetching: isFetchingProducts,
    error: productsError,
    refetch 
  } = useDiscoverProducts({
    page,
    limit: 12,
    category: filterCategory,
    platform: filterPlatform,
    minScore,
    maxPrice,
    competition: filterComp
  });

  const meta = productsResponse?.meta;
  const { data: saved = [] } = useSavedProducts();
  const { data: ownProductsData = [] } = useOwnProducts();
  
  const createManualProduct = useCreateManualProduct();
  const saveProduct = useSaveProduct();
  const generateAd = useGenerateListing();
  const publishAd = usePublishListing();

  const [toast, setToast] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [generatedAd, setGeneratedAd] = useState<{ id: string; title: string; description: string; price: number } | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [oneClickPublishingId, setOneClickPublishingId] = useState<string | null>(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [productMode, setProductMode] = useState<'supplier' | 'own'>('supplier');
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualProduct, setManualProduct] = useState<Partial<Product>>({
    name: "",
    category: "",
    suggestedPrice: 0,
    costPrice: 0,
    image_url: "",
    description: "",
    stock: 1
  });

  
  const isLimitReached = profile?.is_blocked;
  
  const getBlockMessage = () => {
    if (profile?.subscription_status === 'pending') {
      return "Sua assinatura está pendente. Realize o pagamento para continuar.";
    }
    if (profile?.subscription_status === 'expired') {
      return "Sua assinatura expirou. Renove para continuar usando a plataforma.";
    }
    return "Acesso limitado. Renove seu acesso para continuar.";
  };

  // Products are already filtered by the server based on current filters and page
  const displayedProducts = useMemo(() => {
    if (productsError) return [];
    return productsResponse?.data || [];
  }, [productsResponse?.data, productsError]);

  const handleFilterChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setter(e.target.value);
    setPage(1); // Reset page to 1 on filter change
  };

  const isSaved = (productId: string) => saved.some((s: { id: string }) => s.id === productId);
  const isSelected = (id: string) => selectedIds.includes(id);

  const handleViewProduct = (p: Product) => {
    if (!profile) return;
    const userId = profile.id || (profile as { uid?: string }).uid || '';
    if (!userId) return;
    logActivity(userId, {
      action: "Produto Visualizado",
      description: `Você visualizou os detalhes do produto "${p.name}".`,
      type: "product",
      metadata: { productId: p.id } as Record<string, unknown>
    });
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => isSelected(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSave = (p: Product) => {
    if (bulkMode) {
      toggleSelection(p.id);
      return;
    }
    if (isLimitReached) {
      setToast(getBlockMessage());
      setTimeout(() => setToast(null), 5000);
      return;
    }

    if (!isSaved(p.id)) {
      saveProduct.mutate(p, {
        onSuccess: () => {
          setToast(`"${p.name}" salvo com sucesso!`);
          setTimeout(() => setToast(null), 3000);
        },
        onError: (error: Error) => {
          setToast(error.message);
          setTimeout(() => setToast(null), 5000);
        }
      });
    }
  };

  const handleGenerateAd = (p: Product) => {
    if (isLimitReached) {
      setToast(getBlockMessage());
      setTimeout(() => setToast(null), 5000);
      return;
    }
    setSelectedProduct(p);
    generateAd.mutate({ product: p, mode: productMode }, {
      onSuccess: (data) => {
        if (data && 'id' in data) {
          setGeneratedAd({
            id: data.id as string,
            title: data.title as string,
            description: data.description as string,
            price: data.price as number
          });
        }
      },
      onError: (error: Error) => {
        setToast(error.message);
        setTimeout(() => setToast(null), 5000);
      }
    });
  };

  const handlePublish = async (platform: string) => {
    if (!generatedAd) return;

    const integration = integrations.find(i => i.platform === platform);
    if (!integration) {
      setToast(`Conecte sua conta do ${platform} primeiro em 'Integrações'.`);
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setIsPublishing(true);
    publishAd.mutate({ 
      platform, 
      listingId: generatedAd.id, 
      listingData: generatedAd,
      integration: integration
    }, {
      onSuccess: (data: { id: string; permalink: string }) => {
        setToast(`Anúncio publicado com sucesso no ${platform} em menos de 1 minuto!`);
        setIsPublishing(false);
        setOneClickPublishingId(null);
        setGeneratedAd(null);
        setSelectedProduct(null);
        setTimeout(() => setToast(null), 3000);
        
        if (data?.permalink) {
          setTimeout(() => window.open(data.permalink, '_blank'), 1500);
        }
      },
      onError: (error: Error) => {
        setToast(error.message || `Erro ao publicar anúncio.`);
        setIsPublishing(false);
        setOneClickPublishingId(null);
        setTimeout(() => setToast(null), 3000);
      }
    });
  };

  const handleOneClickPublish = async (p: Product) => {
    if (isLimitReached) {
      setToast(getBlockMessage());
      setTimeout(() => setToast(null), 5000);
      return;
    }

    if (integrations.length === 0) {
      setToast("Conecte uma plataforma (Shopify, ML, etc) primeiro.");
      setTimeout(() => setToast(null), 3000);
      return;
    }

    // Auto-select platform (matching or first available)
    const platformToUse = PLATFORMS.find(plat => 
      plat !== 'Todos' && (
        integrations.some(i => i.platform.toLowerCase().includes(plat.toLowerCase())) ||
        (p.platform_source && plat.toLowerCase().includes(p.platform_source.toLowerCase().replace('_', '')))
      )
    ) || integrations[0].platform;

    const integration = integrations.find(i => i.platform === platformToUse) || integrations[0];

    setOneClickPublishingId(p.id);
    setIsPublishing(true);

    try {
      // 1. Generate Listing
      const adData = await generateAd.mutateAsync({ product: p, mode: productMode });
      
      // 2. Publish Listing
      const adToPublish = adData as { id: string; title: string; price: number; description?: string; image?: string };
      publishAd.mutate({
        platform: integration.platform,
        listingId: adToPublish.id,
        listingData: adToPublish,
        integration
      }, {
        onSuccess: (data: { id: string; permalink: string }) => {
          setToast(`Publicação relâmpago concluída no ${integration.platform}!`);
          setOneClickPublishingId(null);
          setIsPublishing(false);
          setTimeout(() => setToast(null), 3000);
          if (data?.permalink) {
            setTimeout(() => window.open(data.permalink, '_blank'), 1000);
          }
        },
        onError: (err) => {
          setToast(err.message || "Falha na publicação expressa.");
          setOneClickPublishingId(null);
          setIsPublishing(false);
          setTimeout(() => setToast(null), 3000);
        }
      });
    } catch (err: unknown) {
      const error = err as Error;
      setToast(error.message || "Falha ao preparar anúncio.");
      setOneClickPublishingId(null);
      setIsPublishing(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative pb-20">
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-10 right-10 bg-indigo-600 text-white px-6 py-3 rounded-xl shadow-2xl z-50 font-bold flex items-center gap-2 border border-white/20 backdrop-blur-xl"
          >
            <Check className="w-5 h-5" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(selectedProduct || generateAd.isPending) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-24 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#111113] border border-white/10 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl relative"
            >
              <button 
                onClick={() => { setSelectedProduct(null); setGeneratedAd(null); }}
                className="absolute top-6 right-6 text-white/40 hover:text-white"
              >
                <X />
              </button>

              <div className="p-8">
                {generateAd.isPending ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-6">
                    <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <div className="text-center">
                       <h2 className="text-xl font-bold text-white mb-2">Analisando com IA...</h2>
                       <p className="text-white/40">Gerando conteúdo otimizado para o marketplace.</p>
                    </div>
                  </div>
                ) : generatedAd ? (
                  <div className="space-y-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-600/20 rounded-xl flex items-center justify-center text-indigo-400">
                        <Zap className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">Anúncio Pronto</h2>
                        <p className="text-white/40 text-sm">IA otimizou o SEO e a persuasão da cópia.</p>
                      </div>
                    </div>

                    <div className="space-y-6 bg-white/10 border border-white/5 p-6 rounded-2xl max-h-[400px] overflow-y-auto custom-scrollbar">
                        <div className="space-y-2">
                           <label className="text-[10px] text-white/30 uppercase font-black tracking-widest ml-1">Título do Anúncio (Personalizável)</label>
                           <input 
                             type="text"
                             value={generatedAd.title}
                             onChange={(e) => setGeneratedAd(prev => prev ? { ...prev, title: e.target.value } : null)}
                             className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white font-medium outline-none focus:border-indigo-500 transition-colors"
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] text-white/30 uppercase font-black tracking-widest ml-1">Descrição do Produto</label>
                           <textarea 
                             rows={6}
                             value={generatedAd.description}
                             onChange={(e) => setGeneratedAd(prev => prev ? { ...prev, description: e.target.value } : null)}
                             className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white/80 text-sm outline-none focus:border-indigo-500 transition-colors resize-none leading-relaxed"
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] text-white/30 uppercase font-black tracking-widest ml-1">Preço de Venda Final (R$)</label>
                           <input 
                             type="number"
                             value={generatedAd.price}
                             onChange={(e) => setGeneratedAd(prev => prev ? { ...prev, price: Number(e.target.value) } : null)}
                             className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-2xl font-black text-green-400 outline-none focus:border-green-500 transition-colors"
                           />
                        </div>
                     </div>

                    <div className="space-y-4">
                       <label className="text-sm font-bold text-white">Publicar em:</label>
                       {integrations.length === 0 ? (
                         <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-4">
                            <AlertCircle className="text-red-500 w-8 h-8" />
                            <div className="flex-1">
                               <p className="text-sm font-bold text-red-500">Nenhuma integração ativa</p>
                               <p className="text-xs text-red-500/60">Você precisa conectar uma conta antes de publicar.</p>
                            </div>
                         </div>
                       ) : (
                         <div className="grid grid-cols-2 gap-3">
                            {integrations.map(i => (
                              <button
                                key={i.id}
                                disabled={isPublishing}
                                onClick={() => handlePublish(i.platform)}
                                className="p-4 bg-white/5 hover:bg-indigo-600 transition-all rounded-xl border border-white/10 flex items-center justify-between group"
                              >
                                <span className="font-bold text-white text-sm">{i.platform}</span>
                                {isPublishing ? (
                                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                  <Send className="w-4 h-4 text-white/20 group-hover:text-white transition-colors" />
                                )}
                              </button>
                            ))}
                         </div>
                       )}
                    </div>
                  </div>
                ) : null}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
             <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                <Search className="text-white w-5 h-5" />
             </div>
             <h1 className="text-3xl font-bold text-white uppercase italic tracking-tighter">Hub Universal de Vendas</h1>
          </div>
          <p className="text-white/50">Gerencie seu estoque próprio ou descubra novos fornecedores.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full xl:w-auto">
          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 flex-1 xl:flex-none">
            <button 
              onClick={() => setProductMode('supplier')}
              className={`flex-1 xl:flex-none px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${productMode === 'supplier' ? 'bg-indigo-600 text-white' : 'text-white/40 hover:text-white'}`}
            >
              Fornecedores
            </button>
            <button 
              onClick={() => setProductMode('own')}
              className={`flex-1 xl:flex-none px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${productMode === 'own' ? 'bg-indigo-600 text-white' : 'text-white/40 hover:text-white'}`}
            >
              Meu Estoque
            </button>
          </div>

          <button 
            onClick={() => refetch()}
            className="hidden md:flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest"
          >
            <TrendingUp className="w-4 h-4" />
            Atualizar
          </button>

          <button 
            onClick={() => setBulkMode(!bulkMode)}
            className={`flex items-center gap-2 px-6 py-3 border rounded-xl transition-all text-[10px] font-black uppercase tracking-widest ${bulkMode ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white/5 border-white/10 text-white/50 hover:text-white'}`}
          >
            <Plus className="w-4 h-4" />
            {bulkMode ? 'Cancelar' : 'Lotes'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {productMode === 'own' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-10 mb-20"
          >
             {!showManualForm && ownProductsData.length === 0 ? (
               <motion.div 
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="bg-[#111113] border border-indigo-600/20 rounded-[2.5rem] p-16 text-center flex flex-col items-center gap-6"
               >
                 <div className="w-24 h-24 bg-indigo-600/10 rounded-[2.5rem] flex items-center justify-center text-indigo-400">
                    <Package className="w-12 h-12" />
                 </div>
                 <div className="space-y-2">
                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Seu estoque está vazio</h2>
                    <p className="text-white/40 max-w-sm mx-auto">Cadastre seus itens para gerar anúncios de alta conversão otimizados por IA.</p>
                 </div>
                 <button 
                   onClick={() => setShowManualForm(true)}
                   className="px-10 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-xl shadow-indigo-600/20"
                 >
                   Adicionar Primeiro Produto
                 </button>
               </motion.div>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {ownProductsData.map((p) => (
                    <motion.div 
                      key={p.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-[#111113] border border-white/10 rounded-[2rem] overflow-hidden group hover:border-indigo-600/50 transition-all flex flex-col shadow-xl"
                    >
                       <div className="relative aspect-video overflow-hidden">
                          <img src={p.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                          <div className="absolute top-4 left-4">
                             <div className="px-3 py-1 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-lg">
                               Estoque Próprio
                             </div>
                          </div>
                       </div>
                       <div className="p-6 flex flex-col flex-1">
                          <h3 className="text-lg font-bold text-white mb-2 line-clamp-1">{p.name}</h3>
                          <div className="flex justify-between items-center mb-6">
                             <div className="text-xl font-black text-white italic">
                                {formatCurrency(p.suggestedPrice || 0)}
                             </div>
                             <div className="text-[10px] font-black text-white/30 uppercase tracking-widest">
                                Estoque: {p.stock}
                             </div>
                          </div>
                          <button 
                            onClick={() => handleGenerateAd(p)}
                            className="w-full py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 group shadow-lg"
                          >
                            <Zap className="w-4 h-4 fill-indigo-400 text-indigo-400 group-hover:scale-125 transition-transform" />
                            Publicar Agora
                          </button>
                       </div>
                    </motion.div>
                  ))}
                  <button 
                    onClick={() => setShowManualForm(true)}
                    className="border-2 border-dashed border-white/5 hover:border-indigo-600/30 rounded-[2rem] flex flex-col items-center justify-center gap-4 transition-all hover:bg-indigo-600/5 min-h-[300px]"
                  >
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white/20">
                       <Plus />
                    </div>
                    <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Novo Item</span>
                  </button>
               </div>
             )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showManualForm && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
          >
            <div className="bg-[#111113] border border-white/10 w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
              <button 
                onClick={() => setShowManualForm(false)}
                className="absolute top-8 right-8 text-white/40 hover:text-white"
              >
                <X />
              </button>

              <div className="p-10 overflow-y-auto">
                 <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-indigo-600/20 rounded-2xl flex items-center justify-center text-indigo-400">
                       <Plus className="w-6 h-6" />
                    </div>
                    <div>
                       <h2 className="text-2xl font-bold text-white uppercase italic tracking-tighter">Novo Produto</h2>
                       <p className="text-white/40 text-sm">Configure os detalhes do seu item em estoque.</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                       <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Nome do Produto</label>
                       <input 
                         type="text"
                         value={manualProduct.name}
                         onChange={(e) => setManualProduct(prev => ({ ...prev, name: e.target.value }))}
                         className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl outline-none focus:border-indigo-500 transition-colors text-white"
                         placeholder="Ex: Tênis Esportivo Ultra"
                       />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Preço de Custo</label>
                       <input 
                         type="number"
                         value={manualProduct.costPrice}
                         onChange={(e) => setManualProduct(prev => ({ ...prev, costPrice: Number(e.target.value) }))}
                         className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl outline-none focus:border-indigo-500 transition-colors text-white"
                         placeholder="0.00"
                       />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Preço Sugerido</label>
                       <input 
                         type="number"
                         value={manualProduct.suggestedPrice}
                         onChange={(e) => setManualProduct(prev => ({ ...prev, suggestedPrice: Number(e.target.value) }))}
                         className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl outline-none focus:border-indigo-500 transition-colors text-white"
                         placeholder="0.00"
                       />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                       <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">URL da Imagem</label>
                       <input 
                         type="text"
                         value={manualProduct.image_url}
                         onChange={(e) => setManualProduct(prev => ({ ...prev, image_url: e.target.value }))}
                         className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl outline-none focus:border-indigo-500 transition-colors text-white"
                         placeholder="https://..."
                       />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Estoque Disponível</label>
                       <input 
                         type="number"
                         value={manualProduct.stock}
                         onChange={(e) => setManualProduct(prev => ({ ...prev, stock: Number(e.target.value) }))}
                         className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl outline-none focus:border-indigo-500 transition-colors text-white"
                         placeholder="1"
                       />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Categoria de Venda</label>
                       <input 
                         type="text"
                         value={manualProduct.category}
                         onChange={(e) => setManualProduct(prev => ({ ...prev, category: e.target.value }))}
                         className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl outline-none focus:border-indigo-500 transition-colors text-white"
                         placeholder="Esportes, Moda..."
                       />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                       <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Descrição do Item</label>
                       <textarea 
                         rows={4}
                         value={manualProduct.description}
                         onChange={(e) => setManualProduct(prev => ({ ...prev, description: e.target.value }))}
                         className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl outline-none focus:border-indigo-500 transition-colors text-white resize-none"
                         placeholder="Insira os benefícios e características principais..."
                       />
                    </div>
                 </div>

                 <div className="mt-10 flex gap-4">
                    <button 
                      onClick={() => setShowManualForm(false)}
                      className="flex-1 py-5 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black uppercase tracking-widest transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={() => {
                        createManualProduct.mutate(manualProduct, {
                          onSuccess: (newProduct) => {
                            handleGenerateAd(newProduct as Product);
                            setShowManualForm(false);
                            setManualProduct({ name: "", category: "", suggestedPrice: 0, costPrice: 0, image_url: "", description: "", stock: 1 });
                          }
                        });
                      }}
                      disabled={createManualProduct.isPending}
                      className="flex-1 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20 active:scale-95 disabled:opacity-50"
                    >
                      {createManualProduct.isPending ? "Cadastrando..." : "Confirmar e Publicar"}
                    </button>
                 </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {bulkMode && selectedIds.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-[#111113]/80 backdrop-blur-2xl border border-white/10 p-4 rounded-3xl shadow-2xl flex items-center gap-6 min-w-[300px]"
          >
            <div className="px-4 py-2 bg-indigo-600 rounded-xl">
               <span className="text-xs font-black text-white">{selectedIds.length} selecionados</span>
            </div>
            <div className="flex gap-2">
               <button 
                 onClick={() => {
                   setToast(`${selectedIds.length} produtos adicionados à fila de processamento.`);
                   setSelectedIds([]);
                   setBulkMode(false);
                   setTimeout(() => setToast(null), 3000);
                 }}
                 className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-black uppercase"
               >
                 Salvar Todos
               </button>
               <button 
                 onClick={() => {
                   setToast(`Iniciando publicação em massa para ${selectedIds.length} produtos...`);
                   setSelectedIds([]);
                   setBulkMode(false);
                   setTimeout(() => setToast(null), 3000);
                 }}
                 className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase"
               >
                 Publicar em Massa
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {productMode === 'supplier' &&
        <Fragment>
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6">
        <div className="flex items-center gap-2 mb-2">
           <Filter className="w-4 h-4 text-indigo-400" />
           <span className="text-xs font-bold uppercase tracking-widest text-white/40">Filtros Avançados</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          <div className="space-y-1">
            <label className="text-[10px] text-white/50 font-black uppercase ml-1 tracking-widest">Marketplace</label>
            <div className="relative">
              <select 
                value={filterPlatform} 
                onChange={handleFilterChange(setFilterPlatform)}
                className="w-full bg-white text-black font-bold text-sm rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all border-2 border-transparent shadow-xl appearance-none cursor-pointer"
              >
                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-black">
                <ArrowDown className="w-4 h-4" />
              </div>
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="text-[10px] text-white/50 font-black uppercase ml-1 tracking-widest">Categoria</label>
            <div className="relative">
              <select 
                value={filterCategory} 
                onChange={handleFilterChange(setFilterCategory)}
                className="w-full bg-white text-black font-bold text-sm rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all border-2 border-transparent shadow-xl appearance-none cursor-pointer"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c === 'Todos' ? 'Selecione uma categoria' : c}</option>)}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-black">
                <ArrowDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-white/50 font-black uppercase ml-1 tracking-widest">Score Mínimo ({minScore})</label>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={minScore}
              onChange={(e) => { setMinScore(Number(e.target.value)); setPage(1); }}
              className="w-full accent-indigo-500 mt-2"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-white/50 font-black uppercase ml-1 tracking-widest">Preço Máx ({formatCurrency(maxPrice)})</label>
            <input 
              type="range" 
              min="0" 
              max="5000" 
              step="50"
              value={maxPrice}
              onChange={(e) => { setMaxPrice(Number(e.target.value)); setPage(1); }}
              className="w-full accent-indigo-500 mt-2"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-white/50 font-black uppercase ml-1 tracking-widest">Concorrência</label>
            <div className="relative">
              <select 
                value={filterComp} 
                onChange={handleFilterChange(setFilterComp)}
                className="w-full bg-white text-black font-bold text-sm rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all border-2 border-transparent shadow-xl appearance-none cursor-pointer"
              >
                {COMPETITION_LEVELS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-black">
                <ArrowDown className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {isLoadingDiscovery ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-6">
          <div className="relative">
             <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
             <div className="absolute inset-0 flex items-center justify-center">
                <Search className="w-6 h-6 text-indigo-500 animate-pulse" />
             </div>
          </div>
          <div className="text-center space-y-1">
             <p className="text-white font-bold">Buscando produtos em alta...</p>
             <p className="text-white/30 text-xs uppercase tracking-widest font-black">Analisando Inteligência de Mercado</p>
          </div>
        </div>
      ) : displayedProducts.length === 0 ? (
        <div className="text-center py-32 bg-white/5 border border-dashed border-white/10 rounded-[2.5rem]">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className={`w-10 h-10 ${productsError ? 'text-red-500' : 'text-white/10'}`} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {productsError instanceof Error && productsError.message.includes('PLATFORM_BLOCKED') 
              ? "Acesso Temporariamente Bloqueado" 
              : "Nenhum produto encontrado"}
          </h2>
          <p className="text-white/40 max-w-sm mx-auto">
            {productsError instanceof Error && productsError.message.includes('PLATFORM_BLOCKED')
              ? "Sua assinatura expirou ou seu período de teste terminou. Renove seu acesso para continuar minerando."
              : "Tente ajustar os filtros ou conectar mais marketplaces para encontrar oportunidades."}
          </p>
          {productsError && (
             <Link to="/plans" className="inline-block mt-8 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-xl">
                Ver Assinatura
             </Link>
          )}
        </div>
      ) : (
        <div className="space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayedProducts.map((p: Product) => (
              <motion.div 
                layout
                key={p.id} 
                className={`bg-[#111113] border rounded-[2rem] overflow-hidden group transition-all flex flex-col shadow-xl ${
                  isSelected(p.id) 
                    ? "border-indigo-500 ring-2 ring-indigo-500/20" 
                    : "border-white/10 hover:border-indigo-600/50 hover:shadow-indigo-600/5"
                }`}
                onClick={() => handleViewProduct(p)}
              >
                <div className="relative aspect-video overflow-hidden">
                  {bulkMode && (
                    <div className="absolute inset-0 bg-black/40 z-10 flex items-center justify-center transition-all group-hover:bg-black/20" onClick={() => toggleSelection(p.id)}>
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${isSelected(p.id) ? 'bg-indigo-600 border-indigo-500' : 'bg-black/20 border-white/40'}`}>
                           {isSelected(p.id) && <Check className="w-5 h-5 text-white" />}
                        </div>
                    </div>
                  )}
                  <img 
                    src={p.image_url || p.image} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const img = e.currentTarget;
                      img.src = "https://http2.mlstatic.com/D_NQ_NP_612260-MLA49455322444_032022-O.webp"; // Real ML default fallback
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-60" />
                  
                  {p.platform_source && (
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                       <div className="w-10 h-6 bg-white/10 backdrop-blur-md rounded-lg border border-white/10 flex items-center justify-center shadow-xl">
                          <img 
                            src={
                              p.platform_source === 'mercado_livre' ? 'https://logodownload.org/wp-content/uploads/2018/10/mercado-livre-logo-13.png' :
                              p.platform_source === 'shopee' ? 'https://logodownload.org/wp-content/uploads/2021/03/shopee-logo-0.png' :
                              p.platform_source === 'amazon' ? 'https://pngimg.com/uploads/amazon/amazon_PNG11.png' :
                              'https://ae01.alicdn.com/kf/H63080b435e2348508eb9dcf4687d6050Y.png'
                            } 
                            className="h-3 w-auto object-contain brightness-0 invert" 
                          />
                       </div>
                       
                       {p.trendingTag && (
                        <div className="px-3 py-1 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-lg flex items-center gap-1.5 animate-pulse">
                          <TrendingUp className="w-2.5 h-2.5" />
                          {p.trendingTag}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
                    {integrations.length > 0 && (
                      <div className="px-3 py-1.5 bg-green-500 text-white border border-white/20 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl flex items-center gap-1.5 animate-in fade-in zoom-in duration-500">
                        <Check className="w-3 h-3" />
                        Pronto para publicar
                      </div>
                    )}
                    <div className="px-3 py-1.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl text-[10px] font-black text-indigo-400 flex items-center gap-1.5 shadow-xl">
                      {p.trendStatus === 'up' && <ArrowUp className="w-3 h-3 text-green-400" />}
                      {p.trendStatus === 'down' && <ArrowDown className="w-3 h-3 text-red-400" />}
                      OPORTUNIDADE: {p.score}%
                    </div>
                    {p.updatedAt && (
                      <div className="px-2 py-0.5 bg-black/40 backdrop-blur-md border border-white/5 rounded-lg text-[8px] font-bold text-white/40 uppercase tracking-tighter">
                        Att: {new Date(p.updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>

                  <div className="absolute bottom-4 left-4 flex items-center gap-2">
                    <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-bold text-white border border-white/10">
                        {p.source}
                    </div>
                    <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-bold text-white/60 border border-white/10">
                        {p.salesEstimation}
                    </div>
                  </div>
                </div>

                <div className="p-6 flex-col flex-1">
                  <div className="mb-4">
                    <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mb-1">{p.category}</p>
                    <h3 className="font-bold text-white text-xl leading-tight group-hover:text-indigo-400 transition-colors uppercase tracking-tight line-clamp-1">{p.name}</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-white/5 px-3 py-2 rounded-xl border border-white/5">
                      <div className="text-[9px] text-white/30 uppercase font-black mb-0.5">Demanda</div>
                      <div className="text-xs font-bold text-white">{p.demandLevel || "Alta"}</div>
                    </div>
                    <div className="bg-white/5 px-3 py-2 rounded-xl border border-white/5">
                      <div className="text-[9px] text-white/30 uppercase font-black mb-0.5">Competição</div>
                      <div className={`text-xs font-bold ${p.competition === "Baixa" ? "text-green-400" : p.competition === "Média" ? "text-yellow-400" : "text-red-400"}`}>
                        {p.competition}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-8">
                    <div className="bg-white/5 px-2 py-3 rounded-2xl text-center border border-white/5">
                      <div className="text-[8px] text-white/30 uppercase font-black mb-1">Custo</div>
                      <div className="text-xs font-black text-white">{formatCurrency(p.costPrice)}</div>
                    </div>
                    <div className="bg-white/5 px-2 py-3 rounded-2xl text-center border border-white/5">
                      <div className="text-[8px] text-white/30 uppercase font-black mb-1">Venda</div>
                      <div className="text-xs font-black text-white">{formatCurrency(p.suggestedPrice)}</div>
                    </div>
                    <div className="bg-green-500/10 px-2 py-3 rounded-2xl text-center border border-green-500/20">
                      <div className="text-[8px] text-green-500/50 uppercase font-black mb-1">Margem</div>
                      <div className="text-xs font-black text-green-400">{p.margin}%</div>
                    </div>
                  </div>

                  <div className="mt-auto space-y-3">
                    <div className="flex gap-3">
                      <button 
                        onClick={() => handleOneClickPublish(p)}
                        disabled={oneClickPublishingId === p.id || integrations.length === 0}
                        className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 group shadow-xl active:scale-95 ${
                          oneClickPublishingId === p.id 
                            ? "bg-indigo-600/50 text-white cursor-wait"
                            : integrations.length === 0
                              ? "bg-white/5 text-white/20 border border-white/10 cursor-not-allowed"
                              : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20 text-white"
                        }`}
                      >
                        {oneClickPublishingId === p.id ? (
                           <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Zap className="w-4 h-4 fill-current group-hover:scale-125 transition-transform" />
                        )}
                        {oneClickPublishingId === p.id ? "Publicando..." : integrations.length === 0 ? "Produto Incompleto" : "Publicar em 1 clique"}
                      </button>
                    </div>

                    <div className="flex gap-3">
                      <button 
                        onClick={() => handleGenerateAd(p)}
                        className="flex-1 py-3 text-white/40 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-white/5 hover:bg-white/5"
                      >
                        Personalizar Anúncio
                      </button>
                      <button 
                        onClick={() => handleSave(p)}
                        disabled={isSaved(p.id)}
                        className={`p-3 rounded-xl transition-all active:scale-90 ${
                          isSaved(p.id) 
                            ? "bg-green-500/20 text-green-400 border border-green-500/20" 
                            : "bg-white/5 hover:bg-white/10 border border-white/10 text-white"
                        }`}
                      >
                        {isSaved(p.id) ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pagination Controls */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 py-8 border-t border-white/5">
              <button 
                disabled={page === 1 || isFetchingProducts}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold text-xs"
              >
                Anterior
              </button>
              <div className="flex items-center gap-2">
                {[...Array(Math.min(5, meta.totalPages))].map((_, i) => {
                  const pageNum = i + 1;
                  // Simple window for pagination
                  let actualPageNum = pageNum;
                  if (page > 3 && meta.totalPages > 5) {
                    actualPageNum = Math.min(page - 2 + i, meta.totalPages - 4 + i);
                  }
                  if (actualPageNum > meta.totalPages) return null;

                  return (
                    <button
                      key={actualPageNum}
                      onClick={() => setPage(actualPageNum)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all border ${
                        page === actualPageNum 
                          ? "bg-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-600/20" 
                          : "bg-white/5 border-white/10 text-white/40 hover:text-white"
                      }`}
                    >
                      {actualPageNum}
                    </button>
                  );
                })}
              </div>
              <button 
                disabled={page === meta.totalPages || isFetchingProducts}
                onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold text-xs"
              >
                Próxima
              </button>
            </div>
          )}
        </div>
      )}
    </Fragment>
  }
      {isLimitReached && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] pointer-events-none flex items-end justify-center pb-20 px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#111113] border border-red-500/30 p-8 rounded-[2.5rem] shadow-2xl max-w-lg w-full pointer-events-auto text-center space-y-6"
          >
             <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto text-red-500">
                <AlertCircle className="w-8 h-8" />
             </div>
             <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white uppercase italic tracking-tighter">Acesso Expirado</h3>
                <p className="text-white/40 text-sm">Sua assinatura expirou. Renove seu acesso para continuar minerando produtos e gerando anúncios.</p>
             </div>
             <Link 
               to="/plans"
               className="block w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20"
             >
                Renovar Agora
             </Link>
          </motion.div>
        </div>
      )}
    </div>
  );
};
