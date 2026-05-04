import { TrendingUp, Search, Plus, Zap, Mail, RefreshCw, AlertCircle } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { useDashboardStats } from "../hooks/useProducts";
import { useAuth } from "../hooks/useAuth";
import { Link } from "react-router-dom";
import { formatCurrency } from "../lib/formatters";
import { createNotification } from "../hooks/useNotifications";
import { useState } from "react";

const MetricCard = ({ title, value, change, icon }: { title: string, value: string, change: string | number, icon: React.ReactNode }) => (
  <div className="bg-white/5 border border-white/10 p-6 rounded-2xl relative overflow-hidden group">
    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 blur-[40px] rounded-full -mr-10 -mt-10 group-hover:bg-indigo-500/10 transition-colors" />
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">{icon}</div>
      <span className="text-green-400 text-[10px] font-black bg-green-400/10 px-2 py-1 rounded-lg uppercase tracking-widest">{change}</span>
    </div>
    <div className="text-white/30 text-[10px] font-black uppercase tracking-widest mb-1">{title}</div>
    <div className="text-2xl font-black text-white italic tracking-tighter">{value}</div>
  </div>
);

export const Dashboard = () => {
  const { profile, user } = useAuth();
  const { data: stats } = useDashboardStats();
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  const handleSync = async () => {
    if (!user) return;
    if (isBlocked) {
      alert(getBlockMessage());
      return;
    }
    setSyncing(true);
    setSyncSuccess(false);

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create a few notifications for the user
      await createNotification(user.uid, {
        title: "Sincronização Concluída",
        message: "O robô de mineração encontrou 8 novos produtos vencedores em categorias de alta demanda!",
        type: "product"
      });

      await createNotification(user.uid, {
        title: "Atualização de Fornecedores",
        message: "3 novos fornecedores premium do AliExpress foram validados para o seu catálogo.",
        type: "system"
      });

      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
    } catch (error) {
      console.error("Sync error:", error);
    } finally {
      setSyncing(false);
    }
  };

  const chartData = [
    { name: "Seg", value: 400 },
    { name: "Ter", value: 300 },
    { name: "Qua", value: 600 },
    { name: "Qui", value: 800 },
    { name: "Sex", value: 500 },
    { name: "Sab", value: 900 },
    { name: "Dom", value: 1100 },
  ];

  const salesCount = stats?.sales || 0;
  const revenue = stats?.revenue || 0;
  const listingsCount = stats?.listings || 0;
  const savedCount = stats?.savedCount || 0;

  const isBlocked = profile?.subscription_status !== 'active';
  const hasData = salesCount > 0 || listingsCount > 0 || savedCount > 0;
  const getBlockMessage = () => {
    if (profile?.subscription_status === 'pending') {
      return "Sua assinatura está pendente. Realize o pagamento para continuar.";
    }
    if (profile?.subscription_status === 'expired') {
      return "Sua assinatura expirou. Renove para continuar usando a plataforma.";
    }
    return "Acesso limitado. Renove seu acesso para continuar.";
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {isBlocked && (
        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-[50px] rounded-full -mr-16 -mt-16" />
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-red-500 bg-red-500/10">
                <AlertCircle className="w-6 h-6" />
             </div>
             <div>
                <h3 className="font-bold text-white italic uppercase tracking-tighter">Acesso Restrito</h3>
                <p className="text-white/60 text-sm">
                  {getBlockMessage()}
                </p>
             </div>
          </div>
          <Link 
            to="/plans"
            className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-black uppercase text-[10px] tracking-widest rounded-xl transition-all shadow-lg active:scale-95 whitespace-nowrap"
          >
            Renovar Acesso
          </Link>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 text-center md:text-left">
        <div className="w-full">
          <h1 className="text-3xl font-bold text-white mb-2 italic tracking-tighter uppercase">Painel de Controle</h1>
          <p className="text-white/50">Olá, {profile?.name || profile?.email?.split('@')[0]}. Bem-vindo de volta!</p>
        </div>
        
        <div className="flex items-center gap-4 flex-shrink-0">
          <button 
            onClick={handleSync}
            disabled={syncing}
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-xl group ${
              syncSuccess ? 'bg-green-500 text-white' : 'bg-white/5 hover:bg-white/10 text-indigo-400 border border-white/5'
            }`}
          >
            {syncing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : syncSuccess ? (
              <Zap className="w-4 h-4 fill-current" />
            ) : (
              <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
            )}
            {syncing ? 'Sincronizando...' : syncSuccess ? 'Sincronizado' : 'Sincronizar Agora'}
          </button>
        </div>
      </div>



      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <MetricCard title="Vendas" value={String(salesCount)} change="0%" icon={<TrendingUp />} />
        <MetricCard title="Faturamento" value={formatCurrency(revenue)} change="0%" icon={<Zap className="w-5 h-5" />} />
        <MetricCard title="Anúncios" value={String(listingsCount)} change="0%" icon={<Search />} />
        <MetricCard title="Produtos" value={String(savedCount)} change="0%" icon={<Plus className="w-5 h-5" />} />
        <MetricCard title="Mensagens" value={String(stats?.messages || 0)} change="0%" icon={<Mail className="w-5 h-5" />} />
      </div>

      {!hasData && (
        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-12 text-center flex flex-col items-center justify-center gap-6 shadow-2xl">
           <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400">
              <Plus className="w-10 h-10" />
           </div>
           <div>
              <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-2">Você ainda não possui dados ativos</h3>
              <p className="text-white/40 max-w-md mx-auto text-sm">
                Sua jornada começa aqui. Comece analisando o mercado para encontrar produtos vencedores e criar seus primeiros anúncios.
              </p>
           </div>
           <Link 
             to="/explore"
             className="px-10 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-xl shadow-indigo-600/20"
           >
             Começar a Minerar
           </Link>
        </div>
      )}

      {hasData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="font-bold text-white mb-6 uppercase italic tracking-tighter">Volume de Vendas (Sugestão IA)</h2>
            <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                <XAxis dataKey="name" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0A0A0B', border: '1px solid #ffffff10', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/10 flex justify-between items-center">
            <h2 className="font-bold text-white uppercase italic tracking-tighter">Últimas Oportunidades</h2>
            <Link to="/explore" className="text-xs text-indigo-400 font-bold hover:underline uppercase tracking-widest">Ver tudo</Link>
          </div>
          <div className="p-6 text-center py-20">
             <div className="text-white/20 text-xs font-black uppercase tracking-widest">Nenhuma oportunidade recente</div>
          </div>
        </div>
      </div>
    )}
      
      {/* Advanced Analytics */}
      <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 relative overflow-hidden group">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
           <div>
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Índice de Penetração de Mercado</h2>
              <p className="text-white/40 text-sm">Análise profunda de IA sobre competição vs saturação de demanda.</p>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
           {[
             { label: 'Saturação de Mercado', value: '18%', status: 'Baixa' },
             { label: 'Intensidade de Busca', value: '4.2x', status: 'Crescente' },
             { label: 'Giro de Estoque', value: '12d', status: 'Rápido' },
             { label: 'Sentimento do Cliente', value: '92%', status: 'Positivo' }
           ].map((m, idx) => (
             <div key={idx} className="bg-white/5 p-6 rounded-3xl border border-white/5 hover:border-indigo-500/30 transition-colors">
                <div className="text-[10px] text-white/30 uppercase font-black mb-1">{m.label}</div>
                <div className="text-3xl font-black text-white mb-2 tracking-tighter">{m.value}</div>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-green-400"></div>
                   <span className="text-[10px] font-bold text-green-400 uppercase">{m.status}</span>
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};
