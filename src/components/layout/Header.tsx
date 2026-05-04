import { NotificationBell } from "./NotificationBell";
import { Search, User } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { Link } from "react-router-dom";

export const Header = () => {
  const { profile } = useAuth();

  return (
    <header className="h-20 flex items-center justify-between px-12 sticky top-0 bg-black/50 backdrop-blur-xl border-b border-white/5 z-20">
      <div className="relative w-96 group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-indigo-400 transition-colors" />
        <input 
          type="text" 
          placeholder="Pesquisar por produtos ou fornecedores..."
          className="w-full bg-white/5 border border-white/5 py-2.5 pl-12 pr-4 rounded-xl text-xs font-medium outline-none focus:border-indigo-500/50 transition-all text-white placeholder:text-white/20"
        />
      </div>

      <div className="flex items-center gap-6">
        <NotificationBell />
        
        <div className="w-px h-6 bg-white/10" />

        <Link to="/settings" className="flex items-center gap-4 group">
          <div className="text-right hidden md:block">
            <h4 className="text-xs font-black text-white italic uppercase tracking-tighter group-hover:text-indigo-400 transition-colors">
              {profile?.name?.split(' ')[0] || 'Usuário'}
            </h4>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none mt-0.5">
              Acesso Total
            </p>
          </div>
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20 group-hover:scale-110 transition-transform overflow-hidden border border-white/10">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5" />
            )}
          </div>
        </Link>
      </div>
    </header>
  );
};
