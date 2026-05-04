import React, { useState, useEffect, ReactNode } from "react";
import { Link2, Link2Off, Zap, X, ShieldAlert, Plus } from "lucide-react";
import { useIntegrations, useConnectIntegration, useDisconnectIntegration } from "../hooks/useIntegrations";
import { motion, AnimatePresence } from "motion/react";

interface Platform {
  id: string;
  icon: ReactNode;
  color: string;
  fields: string[];
}

const PLATFORMS: Platform[] = [
  { 
    id: "Mercado Livre", 
    icon: <img src="https://logodownload.org/wp-content/uploads/2016/08/mercado-livre-logo-0.png" className="w-10 h-10 object-contain" alt="Mercado Livre" referrerPolicy="no-referrer" />, 
    color: "bg-[#FFF159]", 
    fields: ["clientId", "clientSecret"] 
  },
  { 
    id: "Shopee", 
    icon: <img src="https://logodownload.org/wp-content/uploads/2019/05/shopee-logo-0.png" className="w-8 h-8 object-contain" alt="Shopee" referrerPolicy="no-referrer" />, 
    color: "bg-[#EE4D2D]", 
    fields: ["apiKey", "shopId"] 
  },
  { 
    id: "Amazon", 
    icon: <img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" className="w-10 h-6 object-contain brightness-0 invert" alt="Amazon" referrerPolicy="no-referrer" />, 
    color: "bg-black", 
    fields: ["accessKey", "secretKey", "merchantId"] 
  },
  { 
    id: "AliExpress", 
    icon: <img src="https://upload.wikimedia.org/wikipedia/commons/3/3b/AliExpress_logo.svg" className="w-12 h-6 object-contain" alt="AliExpress" referrerPolicy="no-referrer" />, 
    color: "bg-[#E62E04]", 
    fields: ["apiKey", "trackingId"] 
  },
  { 
    id: "Shopify", 
    icon: <img src="https://upload.wikimedia.org/wikipedia/commons/0/0e/Shopify_logo_2018.svg" className="w-8 h-8 object-contain" alt="Shopify" referrerPolicy="no-referrer" />, 
    color: "bg-[#95BF47]", 
    fields: ["shopDomain", "accessToken"] 
  },
  { 
    id: "Magalu", 
    icon: <img src="https://upload.wikimedia.org/wikipedia/commons/4/4b/Logo_Magazine_Luiza.svg" className="w-10 h-10 object-contain" alt="Magalu" referrerPolicy="no-referrer" />, 
    color: "bg-[#0086FF]", 
    fields: ["apiKey", "sellerId"] 
  },
];

const IntegrationLogo = ({ platform, size = "md" }: { platform: string, size?: "sm" | "md" | "lg" }) => {
  const official = PLATFORMS.find(p => p.id === platform);
  const sizeClasses = size === "lg" ? "w-20 h-20" : size === "md" ? "w-12 h-12" : "w-10 h-10";
  const iconSizeClasses = size === "lg" ? "w-full h-full p-4" : "w-full h-full p-2";
  
  if (official) {
    return (
      <div className={`${sizeClasses} ${official.color} rounded-[2rem] flex items-center justify-center shadow-lg`}>
        <div className={iconSizeClasses}>
          {official.icon}
        </div>
      </div>
    );
  }

  // Fallback for custom platforms
  const letter = platform.charAt(0).toUpperCase();
  const colors = [
    'bg-indigo-500', 'bg-purple-500', 'bg-blue-500', 
    'bg-emerald-500', 'bg-rose-500', 'bg-amber-500'
  ];
  const colorHash = platform.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colorIndex = colorHash % colors.length;

  return (
    <div className={`${sizeClasses} ${colors[colorIndex]} rounded-[2rem] flex items-center justify-center font-black text-white italic shadow-lg uppercase`}>
      {size === "lg" ? <span className="text-3xl">{letter}</span> : <span>{letter}</span>}
    </div>
  );
};

export const Integrations = () => {
  const { data, isLoading, isError } = useIntegrations();
  const integrations = data || [];
  const connect = useConnectIntegration();
  const disconnect = useDisconnectIntegration();

  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [loadTimeout, setLoadTimeout] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading) {
      timer = setTimeout(() => {
        setLoadTimeout(true);
      }, 5000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isLoading]);

  if (isError || (isLoading && loadTimeout)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <ShieldAlert className="w-12 h-12 text-red-500" />
        <h2 className="text-xl font-bold text-white">Erro ao carregar integrações</h2>
        <p className="text-white/40">Tente atualizar a página em alguns instantes.</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest"
        >
          Recarregar
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 border-4 border-white/10 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-white/40 font-medium italic">Sincronizando suas plataformas...</p>
      </div>
    );
  }

  const isConnected = (platform: string) => integrations.find(i => i.platform === platform);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedPlatform && !isCustomMode) return;

    if (isCustomMode) {
      if (!formData.platformName) {
        setError("Nome da plataforma é obrigatório.");
        return;
      }
      connect.mutate({ 
        platform: formData.platformName as string,
        url: formData.url as string,
        apiKey: formData.apiKey as string,
        type: formData.type as string || "Marketplace",
        is_custom: true 
      }, {
        onSuccess: () => {
          setIsCustomMode(false);
          setFormData({});
        }
      });
      return;
    }

    const missing = selectedPlatform.fields.some((f: string) => !formData[f]);
    if (missing) {
      setError("Preencha todos os campos para conectar.");
      return;
    }

    connect.mutate({ platform: selectedPlatform.id, ...formData }, {
      onSuccess: () => {
        setSelectedPlatform(null);
        setFormData({});
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <AnimatePresence>
        {(selectedPlatform || isCustomMode) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111113] border border-white/10 w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl relative"
            >
              <button 
                onClick={() => { setSelectedPlatform(null); setIsCustomMode(false); setError(""); setFormData({}); }}
                className="absolute top-8 right-8 text-white/40 hover:text-white"
              >
                <X />
              </button>

              <div className="p-10">
                  <div className="flex items-center gap-4 mb-8">
                     <IntegrationLogo platform={isCustomMode ? (formData.platformName || "Nova") : (selectedPlatform?.id || "")} size="md" />
                     <div>
                        <h2 className="text-2xl font-bold text-white">{isCustomMode ? "Nova Integração" : selectedPlatform?.id}</h2>
                        <p className="text-white/40 text-sm">{isCustomMode ? "Configurar plataforma customizada" : "Configuração da API"}</p>
                     </div>
                  </div>

                 {error && (
                   <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-xs font-bold uppercase">
                      <ShieldAlert className="w-4 h-4" />
                      {error}
                   </div>
                 )}

                 <form onSubmit={handleConnect} className="space-y-6">
                    {isCustomMode ? (
                      <>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Nome da Plataforma</label>
                           <input 
                             type="text"
                             required
                             value={formData.platformName || ""}
                             onChange={(e) => setFormData(prev => ({ ...prev, platformName: e.target.value }))}
                             className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl outline-none focus:border-indigo-500 transition-colors text-white placeholder:text-white/10"
                             placeholder="Ex: Minha Loja"
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">URL (Opcional)</label>
                           <input 
                             type="text"
                             value={formData.url || ""}
                             onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                             className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl outline-none focus:border-indigo-500 transition-colors text-white placeholder:text-white/10"
                             placeholder="https://..."
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">API Key / Token (Opcional)</label>
                           <input 
                             type="password"
                             value={formData.apiKey || ""}
                             onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                             className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl outline-none focus:border-indigo-500 transition-colors text-white placeholder:text-white/10"
                             placeholder="••••••••••••"
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Tipo</label>
                           <select 
                             value={formData.type || "Marketplace"}
                             onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                             className="w-full bg-[#1A1A1C] border border-white/5 p-4 rounded-2xl outline-none focus:border-indigo-500 transition-colors text-white"
                           >
                             <option value="Marketplace">Marketplace</option>
                             <option value="E-commerce">Loja Virtual</option>
                             <option value="Outro">Outro</option>
                           </select>
                        </div>
                      </>
                    ) : (
                      selectedPlatform?.fields.map((field: string) => (
                        <div key={field} className="space-y-2">
                          <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">
                            {field === 'clientId' ? 'Client ID' : 
                             field === 'clientSecret' ? 'Client Secret' : 
                             field === 'apiKey' ? 'API Key' : 
                             field === 'shopId' ? 'ID da Loja' :
                             field === 'shopDomain' ? 'Domínio da Loja' :
                             field === 'accessToken' ? 'Access Token' :
                             field === 'sellerId' ? 'ID do Vendedor (Magalu)' :
                             field === 'accessKey' ? 'Access Key' :
                             field === 'secretKey' ? 'Secret Key' :
                             field === 'merchantId' ? 'Merchant ID' :
                             field === 'trackingId' ? 'Tracking ID' : field}
                          </label>
                          <input 
                            type="password"
                            value={formData[field] || ""}
                            onChange={(e) => setFormData(prev => ({ ...prev, [field]: e.target.value }))}
                            className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl outline-none focus:border-indigo-500 transition-colors text-white placeholder:text-white/10"
                            placeholder="••••••••••••"
                          />
                        </div>
                      ))
                    )}

                    <button 
                      disabled={connect.isPending}
                      className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-50"
                    >
                      {connect.isPending ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Link2 className="w-5 h-5" />
                          Salvar Integração
                        </>
                      )}
                    </button>
                    <p className="text-[10px] text-center text-white/20 uppercase font-black">Seus dados são criptografados de ponta a ponta</p>
                 </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 italic uppercase tracking-tighter">Integrações</h1>
          <p className="text-white/50">Conecte suas lojas via API para automação total.</p>
        </div>
        
        <button 
          onClick={() => setIsCustomMode(true)}
          className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center gap-3"
        >
          <Plus className="w-4 h-4" />
          Adicionar Plataforma
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {PLATFORMS.map((platform) => {
          const connection = isConnected(platform.id);
          return (
            <div key={platform.id} className="bg-[#111113] border border-white/10 rounded-3xl p-8 flex flex-col items-center text-center space-y-6 group hover:border-indigo-500/50 transition-all shadow-xl">
              <div className="group-hover:scale-110 transition-transform">
                <IntegrationLogo platform={platform.id} size="lg" />
              </div>
              
              <div>
                <h3 className="font-bold text-2xl text-white italic">{platform.id}</h3>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <div className={`w-2 h-2 rounded-full ${connection ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-white/20'}`} />
                  <span className={`text-[10px] font-black uppercase tracking-widest ${connection ? 'text-green-500' : 'text-white/30'}`}>
                    {connection ? 'Conectado' : 'Não conectado'}
                  </span>
                </div>
              </div>

              {connection ? (
                <button 
                  onClick={() => disconnect.mutate(connection.id)}
                  disabled={disconnect.isPending}
                  className="w-full py-4 bg-white/5 hover:bg-red-500/10 text-white/40 hover:text-red-400 border border-white/10 hover:border-red-500/50 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                >
                  <Link2Off className="w-4 h-4" />
                  Desconectar
                </button>
              ) : (
                <button 
                  onClick={() => setSelectedPlatform(platform)}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
                >
                  <Link2 className="w-4 h-4" />
                  Conectar Conta
                </button>
              )}
            </div>
          );
        })}
        
        {/* Custom Integrations */}
        {integrations.filter(i => i.is_custom).map((connection) => (
          <div key={connection.id} className="bg-[#111113] border border-white/10 rounded-3xl p-8 flex flex-col items-center text-center space-y-6 group hover:border-indigo-500/50 transition-all shadow-xl">
            <div className="group-hover:scale-110 transition-transform">
              <IntegrationLogo platform={connection.platform} size="lg" />
            </div>
            
            <div>
              <h3 className="font-bold text-2xl text-white italic">{connection.platform}</h3>
              <div className="flex items-center justify-center gap-2 mt-2">
                <div className={`w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]`} />
                <span className={`text-[10px] font-black uppercase tracking-widest text-green-500`}>
                  Conectado
                </span>
              </div>
            </div>

            <button 
              onClick={() => disconnect.mutate(connection.id)}
              disabled={disconnect.isPending}
              className="w-full py-4 bg-white/5 hover:bg-red-500/10 text-white/40 hover:text-red-400 border border-white/10 hover:border-red-500/50 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
            >
              <Link2Off className="w-4 h-4" />
              Desconectar
            </button>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-indigo-600/10 to-purple-600/10 border border-white/10 rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center gap-10">
        <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center backdrop-blur-xl border border-white/10">
           <Zap className="text-indigo-400 w-12 h-12" />
        </div>
        <div className="flex-1 text-center md:text-left">
           <h2 className="text-2xl font-bold text-white mb-2">Como funciona a integração?</h2>
           <p className="text-white/40 max-w-xl leading-relaxed">Nós utilizamos as APIs oficiais de cada marketplace. Ao inserir suas credenciais, você permite que nossa IA publique anúncios e gerencie estoque de forma 100% automatizada e segura.</p>
        </div>
        <div className="flex gap-4">
           <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white/40 font-black">1</div>
              <span className="text-[10px] uppercase font-black text-white/30">API</span>
           </div>
           <div className="flex flex-col items-center gap-3 mt-4">
              <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white/40 font-black">2</div>
              <span className="text-[10px] uppercase font-black text-white/30">SYNC</span>
           </div>
           <div className="flex flex-col items-center gap-3 mt-8">
              <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-600/20">3</div>
              <span className="text-[10px] uppercase font-black text-indigo-400">SALE</span>
           </div>
        </div>
      </div>
    </div>
  );
};
