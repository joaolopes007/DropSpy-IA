import { useState, useEffect } from "react";
import { 
  User, 
  Mail, 
  LogOut, 
  CheckCircle2, 
  Shield, 
  Smartphone, 
  Globe, 
  Building2, 
  Phone, 
  FileText, 
  Bell, 
  Clock, 
  Camera, 
  Lock,
  ChevronRight,
  AlertTriangle
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { motion, AnimatePresence } from "motion/react";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { auth } from "../lib/firebase";

export const Settings = () => {
  const { profile, logout, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  
  // Profile States
  const [profileData, setProfileData] = useState({
    name: profile?.name || "",
    phone: profile?.phone || "",
    company: profile?.company || "",
    document: profile?.document || "",
    country: profile?.country || "Brasil",
    timezone: profile?.timezone || "America/Sao_Paulo",
    avatar_url: profile?.avatar_url || ""
  });
  
  // Security States
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: ""
  });
  const [securityAlerts, setSecurityAlerts] = useState(profile?.security_alerts_enabled ?? true);
  
  const [loading, setLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    if (!profile) return;
    
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfileData(prev => {
      const newData = {
        name: profile.name || "",
        phone: profile.phone || "",
        company: profile.company || "",
        document: profile.document || "",
        country: profile.country || "Brasil",
        timezone: profile.timezone || "America/Sao_Paulo",
        avatar_url: profile.avatar_url || ""
      };
      
      const isSame = Object.entries(newData).every(([key, val]) => (prev as Record<string, unknown>)[key] === val);
      if (isSame) return prev;
      return newData;
    });
    
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSecurityAlerts(prev => {
      const newVal = profile.security_alerts_enabled ?? true;
      if (prev === newVal) return prev;
      return newVal;
    });
  }, [profile]);

  const showFeedback = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading('profile');
    try {
      await updateProfile(profileData);
      showFeedback("Perfil atualizado com sucesso!");
    } catch (err) {
      console.error(err);
      showFeedback("Erro ao atualizar perfil.", 'error');
    } finally {
      setLoading(null);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
        showFeedback("As senhas não coincidem.", 'error');
        return;
    }
    if (passwords.new.length < 6) {
        showFeedback("A nova senha deve ter no mínimo 6 caracteres.", 'error');
        return;
    }

    setLoading('security');
    try {
      const u = auth.currentUser;
      if (!u || !u.email) throw new Error("Usuário não autenticado");
      
      const credential = EmailAuthProvider.credential(u.email, passwords.current);
      await reauthenticateWithCredential(u, credential);
      await updatePassword(u, passwords.new);
      
      setPasswords({ current: "", new: "", confirm: "" });
      showFeedback("Senha alterada com sucesso!");
    } catch (err: unknown) {
      console.error(err);
      const firebaseError = err as { code?: string };
      if (firebaseError.code === 'auth/wrong-password') {
          showFeedback("Senha atual incorreta.", 'error');
      } else {
          showFeedback("Erro ao alterar senha. Tente novamente.", 'error');
      }
    } finally {
      setLoading(null);
    }
  };

  const toggleSecurityAlerts = async () => {
    const newValue = !securityAlerts;
    setSecurityAlerts(newValue);
    try {
      await updateProfile({ security_alerts_enabled: newValue });
      showFeedback("Preferência de alerta atualizada.");
    } catch (err) {
      console.error(err);
      setSecurityAlerts(!newValue);
      showFeedback("Erro ao atualizar preferência.", 'error');
    }
  };

  const formatPhone = (val: string) => {
    const numbers = val.replace(/\D/g, "");
    if (numbers.length >= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }
    if (numbers.length >= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    }
    return numbers;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      {/* Feedback Toast */}
      <AnimatePresence>
        {feedback && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className={`fixed top-10 left-1/2 z-[100] px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-center gap-3 ${
              feedback.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
            }`}
          >
            {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            <span className="font-bold text-sm tracking-tight">{feedback.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
        <div>
          <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-2">Minha Conta</h1>
          <p className="text-white/40 font-medium">Gerencie suas informações, segurança e integrações.</p>
        </div>

          <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
            <button 
              onClick={() => setActiveTab('profile')}
              className={`px-8 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'profile' ? 'bg-indigo-600 text-white shadow-xl italic' : 'text-white/40 hover:text-white'}`}
            >
              Perfil
            </button>
            <button 
              onClick={() => setActiveTab('security')}
              className={`px-8 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'security' ? 'bg-indigo-600 text-white shadow-xl italic' : 'text-white/40 hover:text-white'}`}
            >
              Segurança
            </button>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <AnimatePresence mode="wait">
            {activeTab === 'profile' && (
              <motion.div 
                key="profile"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8"
              >
                {/* Profile Header Card */}
                <section className="bg-[#111113] border border-white/10 rounded-[2.5rem] p-10 overflow-hidden relative shadow-2xl group">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 blur-[100px] pointer-events-none group-hover:bg-indigo-500/10 transition-colors" />
                  
                  <div className="flex flex-col md:flex-row items-center gap-10">
                     <div className="relative">
                        <div className="w-32 h-32 bg-indigo-600/20 rounded-[3rem] flex items-center justify-center text-indigo-400 overflow-hidden border-4 border-white/5 group-hover:border-indigo-500/20 transition-all">
                           {profile?.avatar_url ? (
                             <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                           ) : (
                             <User className="w-12 h-12" />
                           )}
                        </div>
                        <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-white text-black rounded-2xl flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all">
                           <Camera className="w-5 h-5" />
                        </button>
                     </div>
                     <div className="text-center md:text-left flex-1">
                        <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-2">{profile?.name || "Sem Nome"}</h2>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                           <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-white/40 text-[10px] font-black uppercase tracking-widest">
                              <Mail className="w-3 h-3" />
                              {profile?.email}
                           </div>
                        </div>
                     </div>
                  </div>
                </section>

                {/* Profile Form Card */}
                <section className="bg-[#111113] border border-white/10 rounded-[2.5rem] p-10 shadow-2xl">
                   <div className="flex items-center gap-4 mb-10">
                      <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white/40">
                         <FileText className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-bold text-white uppercase italic tracking-tighter">Informações Pessoais</h3>
                   </div>

                   <form onSubmit={handleProfileUpdate} className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Nome Completo</label>
                            <div className="relative">
                               <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                               <input 
                                 type="text" 
                                 value={profileData.name}
                                 onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                 className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl outline-none focus:border-indigo-500 transition-colors text-white pl-12"
                                 placeholder="Seu nome completo"
                               />
                            </div>
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Telefone / WhatsApp</label>
                            <div className="relative">
                               <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                               <input 
                                 type="text" 
                                 value={profileData.phone}
                                 onChange={(e) => setProfileData({ ...profileData, phone: formatPhone(e.target.value) })}
                                 className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl outline-none focus:border-indigo-500 transition-colors text-white pl-12"
                                 placeholder="(00) 00000-0000"
                               />
                            </div>
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Empresa</label>
                            <div className="relative">
                               <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                               <input 
                                 type="text" 
                                 value={profileData.company}
                                 onChange={(e) => setProfileData({ ...profileData, company: e.target.value })}
                                 className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl outline-none focus:border-indigo-500 transition-colors text-white pl-12"
                                 placeholder="Nome da sua empresa"
                               />
                            </div>
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">CPF / CNPJ</label>
                            <div className="relative">
                               <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                               <input 
                                 type="text" 
                                 value={profileData.document}
                                 onChange={(e) => setProfileData({ ...profileData, document: e.target.value })}
                                 className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl outline-none focus:border-indigo-500 transition-colors text-white pl-12"
                                 placeholder="000.000.000-00"
                               />
                            </div>
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">País</label>
                            <div className="relative">
                               <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                               <select 
                                 value={profileData.country}
                                 onChange={(e) => setProfileData({ ...profileData, country: e.target.value })}
                                 className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl outline-none focus:border-indigo-500 transition-colors text-white pl-12 appearance-none"
                               >
                                  <option value="Brasil">Brasil</option>
                                  <option value="Portugal">Portugal</option>
                                  <option value="EUA">Estados Unidos</option>
                               </select>
                            </div>
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Fuso Horário</label>
                            <div className="relative">
                               <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                               <select 
                                 value={profileData.timezone}
                                 onChange={(e) => setProfileData({ ...profileData, timezone: e.target.value })}
                                 className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl outline-none focus:border-indigo-500 transition-colors text-white pl-12 appearance-none"
                               >
                                  <option value="America/Sao_Paulo">Brasília (GMT-3)</option>
                                  <option value="Europe/Lisbon">Lisboa (GMT+1)</option>
                                  <option value="America/New_York">New York (GMT-5)</option>
                               </select>
                            </div>
                         </div>
                      </div>

                      <button 
                         disabled={loading === 'profile'}
                         className="w-full md:w-auto px-12 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/20"
                      >
                         {loading === 'profile' ? (
                           <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                         ) : "Salvar Perfil"}
                      </button>
                   </form>
                </section>
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div 
                key="security"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8"
              >
                {/* Change Password Card */}
                <section className="bg-[#111113] border border-white/10 rounded-[2.5rem] p-10 shadow-2xl">
                   <div className="flex items-center gap-4 mb-10">
                      <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white/40">
                         <Lock className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-bold text-white uppercase italic tracking-tighter">Alterar Senha</h3>
                   </div>

                   <form onSubmit={handlePasswordChange} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Senha Atual</label>
                            <input 
                              type="password" 
                              value={passwords.current}
                              onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                              className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl outline-none focus:border-indigo-500 transition-colors text-white"
                              placeholder="••••••••"
                            />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Nova Senha</label>
                            <input 
                              type="password" 
                              value={passwords.new}
                              onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                              className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl outline-none focus:border-indigo-500 transition-colors text-white"
                              placeholder="••••••••"
                            />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Confirmar Senha</label>
                            <input 
                              type="password" 
                              value={passwords.confirm}
                              onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                              className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl outline-none focus:border-indigo-500 transition-colors text-white"
                              placeholder="••••••••"
                            />
                         </div>
                      </div>
                      <button 
                         disabled={loading === 'security'}
                         className="w-full md:w-auto px-12 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/20"
                      >
                         {loading === 'security' ? (
                           <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                         ) : "Trocar Senha"}
                      </button>
                   </form>
                </section>

                {/* Active Sessions Card */}
                <section className="bg-[#111113] border border-white/10 rounded-[2.5rem] p-10 shadow-2xl">
                   <div className="flex items-center justify-between mb-10">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white/40">
                            <Smartphone className="w-6 h-6" />
                         </div>
                         <h3 className="text-xl font-bold text-white uppercase italic tracking-tighter">Sessões Ativas</h3>
                      </div>
                      <button className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline decoration-2 underline-offset-4">
                         Encerrar todas as sessões
                      </button>
                   </div>

                   <div className="space-y-4">
                      <div className="flex items-center justify-between p-6 bg-white/5 border border-white/5 rounded-[2rem] group hover:border-indigo-500/20 transition-all">
                         <div className="flex items-center gap-6">
                            <div className="w-14 h-14 bg-indigo-600/10 rounded-2xl flex items-center justify-center text-indigo-400">
                               <Globe className="w-6 h-6" />
                            </div>
                            <div>
                               <div className="flex items-center gap-3 mb-1">
                                  <h4 className="font-bold text-white italic tracking-tight">Chrome em Windows</h4>
                                  <span className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-[10px] font-black uppercase tracking-tight">Dispositivo Atual</span>
                               </div>
                               <p className="text-white/40 text-xs font-medium">São Paulo, Brasil • 186.232.45.12</p>
                            </div>
                         </div>
                         <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white transition-colors" />
                      </div>

                      <div className="flex items-center justify-between p-6 bg-white/5 border border-white/5 rounded-[2rem] group hover:border-indigo-500/20 transition-all">
                         <div className="flex items-center gap-6">
                            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-white/40">
                               <Smartphone className="w-6 h-6" />
                            </div>
                            <div>
                               <div className="flex items-center gap-3 mb-1">
                                  <h4 className="font-bold text-white italic tracking-tight">iPhone 15</h4>
                               </div>
                               <p className="text-white/40 text-xs font-medium">Rio de Janeiro, Brasil • Há 2 horas</p>
                            </div>
                         </div>
                         <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white transition-colors" />
                      </div>
                   </div>
                </section>

                {/* Privacy & Alerts Card */}
                <section className="bg-[#111113] border border-white/10 rounded-[2.5rem] p-10 shadow-2xl">
                   <div className="flex items-center gap-4 mb-10">
                      <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white/40">
                         <Bell className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-bold text-white uppercase italic tracking-tighter">Alertas & Notificações</h3>
                   </div>

                   <div className="flex items-center justify-between p-8 bg-indigo-600/5 border border-indigo-500/10 rounded-3xl">
                      <div className="flex items-center gap-6">
                         <div className="w-14 h-14 bg-indigo-600/10 rounded-2xl flex items-center justify-center text-indigo-400">
                            <Shield className="w-7 h-7" />
                         </div>
                         <div>
                            <h4 className="font-bold text-white italic tracking-tight text-lg">Alertas de Segurança</h4>
                            <p className="text-white/40 text-xs font-medium">Receber notificações por e-mail sobre novos logins e trocas de senha.</p>
                         </div>
                      </div>
                      <button 
                        onClick={toggleSecurityAlerts}
                        className={`w-14 h-8 rounded-full transition-all relative flex items-center px-1 ${securityAlerts ? 'bg-indigo-600' : 'bg-white/10'}`}
                      >
                         <div className={`w-6 h-6 bg-white rounded-full transition-all shadow-lg ${securityAlerts ? 'translate-x-6' : 'translate-x-0'}`} />
                      </button>
                   </div>
                </section>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar Widgets */}
        <aside className="lg:col-span-4 space-y-8">
           <button 
              onClick={() => logout()}
              className="w-full py-6 bg-red-500/10 hover:bg-red-500 border border-red-500/20 hover:border-red-500 text-red-500 hover:text-white rounded-[2rem] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-4 group shadow-xl hover:shadow-red-500/20"
           >
              <LogOut className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
              Sair da conta
           </button>
        </aside>
      </div>
    </div>
  );
};
