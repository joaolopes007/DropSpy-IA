import { Check, Zap, ExternalLink, ShieldCheck, AlertCircle, Clock } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export const Plans = ({ isSettingsView = false }: { isSettingsView?: boolean }) => {
  const { profile } = useAuth();

  const CHECKOUT_URL = "https://checkout.cactopay.com.br/YOUR_CACTO_PLAN_ID"; 

  const isPending = profile?.subscription_status === 'pending';
  const isSubscribed = profile?.subscription_status === 'active';

  return (
    <div className={`space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 ${isSettingsView ? 'pt-4' : ''}`}>
      {!isSettingsView && (
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-white uppercase tracking-tighter italic">
            Sua Assinatura
          </h1>
          <p className="text-white/40 leading-relaxed">
            Gerencie seu acesso e mantenha sua operação de dropshipping em escala máxima.
          </p>
        </div>
      )}

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Status Card */}
        <div className="bg-[#111113] border border-white/10 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            {isSubscribed ? <ShieldCheck className="w-32 h-32 text-green-500" /> : isPending ? <Clock className="w-32 h-32 text-orange-500" /> : <AlertCircle className="w-32 h-32 text-red-500" />}
          </div>

          <div className="space-y-8 relative z-10">
            <div>
              <p className="text-white/40 text-xs font-black uppercase tracking-widest mb-2">Status do Acesso</p>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${isSubscribed ? 'bg-green-500 animate-pulse' : isPending ? 'bg-orange-500 animate-pulse' : 'bg-red-500'}`} />
                <h2 className={`text-2xl font-bold uppercase italic tracking-tighter ${isSubscribed ? 'text-green-500' : isPending ? 'text-orange-500' : 'text-red-500'}`}>
                  {isSubscribed ? "Assinatura Ativa" : isPending ? "Pagamento Pendente" : "Acesso Expirado"}
                </h2>
              </div>
            </div>

            {profile?.subscription_expires_at && (
              <div>
                <p className="text-white/40 text-xs font-black uppercase tracking-widest mb-1">Vencimento</p>
                <div className="flex items-center gap-2 text-white">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  <p className="font-bold">{new Date(profile.subscription_expires_at).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            )}

            <div className="pt-4 space-y-3">
              {isSubscribed ? (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-3 text-green-500 text-sm font-medium">
                  <Check className="w-4 h-4" />
                  Você tem acesso total a todas as ferramentas.
                </div>
              ) : isPending ? (
                <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center gap-3 text-orange-500 text-sm font-medium">
                  <Clock className="w-4 h-4" />
                  Aguardando confirmação do pagamento pelo gateway.
                </div>
              ) : (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-sm font-medium">
                  <AlertCircle className="w-4 h-4" />
                  Renove sua assinatura para liberar as funcionalidades.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Benefits Card */}
        <div className="bg-gradient-to-br from-indigo-600/20 to-indigo-600/5 border border-indigo-500/30 rounded-[2.5rem] p-10 shadow-2xl flex flex-col">
          <div className="flex-1 space-y-6">
            <h3 className="text-xl font-bold text-white uppercase italic tracking-tight">O que está incluído?</h3>
            <div className="space-y-4">
              {[
                "Minerador de Produtos Ilimitado",
                "Gerador de Anúncios com IA",
                "Publicação Instantânea em Marketplaces",
                "Calculadora de Lucro Premium",
                "Acesso a Fornecedores VIP",
                "Suporte Prioritário"
              ].map((benefit, i) => (
                <div key={i} className="flex items-center gap-3 text-white/60">
                  <div className="w-5 h-5 bg-indigo-500/10 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-indigo-400" />
                  </div>
                  <span className="text-sm font-medium">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          <a 
            href={CHECKOUT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 w-full py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-3xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-600/20 hover:scale-[1.02] active:scale-95"
          >
            {isSubscribed ? "Renovar Antecipado" : "Assinar Agora"}
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      <div className="max-w-4xl mx-auto bg-white/5 border border-white/10 rounded-3xl p-10 flex flex-col md:flex-row items-center justify-between gap-8">
         <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
               <Zap className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
               <h3 className="text-xl font-bold text-white italic uppercase tracking-tighter">Precisa de Ajuda?</h3>
               <p className="text-white/40 text-sm">Problemas com sua assinatura ou pagamento? Fale conosco.</p>
            </div>
         </div>
          <a 
            href="https://wa.me/5544999004296"
            target="_blank"
            rel="noopener noreferrer"
            className="px-10 py-5 bg-white text-black hover:bg-indigo-50 transition-all rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl active:scale-95"
          >
            Suporte via WhatsApp
          </a>
      </div>
    </div>
  );
};
