import { Link, useLocation } from "react-router-dom";
import { Search, BarChart3, Plus, Award, Globe, X, Link2, Truck, Calculator, History } from "lucide-react";

const menuItems = [
  { id: "/dashboard", label: "Painel", icon: <BarChart3 className="w-5 h-5" /> },
  { id: "/explore", label: "Produtos", icon: <Search className="w-5 h-5" /> },
  { id: "/saved", label: "Favoritos", icon: <Plus className="w-5 h-5" /> },
  { id: "/integrations", label: "Integrações", icon: <Link2 className="w-5 h-5" /> },
  { id: "/suppliers", label: "Fornecedores", icon: <Truck className="w-5 h-5" /> },
  { id: "/calculator", label: "Calculadora", icon: <Calculator className="w-5 h-5" /> },
  { id: "/activities", label: "Atividades", icon: <History className="w-5 h-5" /> },
  { id: "/plans", label: "Minha Assinatura", icon: <Award className="w-5 h-5" /> },
  { id: "/settings", label: "Configurações", icon: <Globe className="w-5 h-5" /> },
];

export const Sidebar = ({ onLogout }: { onLogout: () => void }) => {
  const location = useLocation();

  return (
    <aside className="w-64 border-r border-white/10 bg-[#0A0A0B] flex flex-col h-screen fixed left-0 top-0 z-30">
      <div className="p-8">
        <Link to="/dashboard" className="flex items-center gap-2 mb-10 group">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center transform group-hover:rotate-12 transition-transform">
            <Search className="text-white w-4 h-4" />
          </div>
          <span className="text-xl font-bold text-white">DropSpy <span className="text-indigo-500">AI</span></span>
        </Link>
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.id}
              to={item.id}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                location.pathname === item.id 
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
                  : "text-white/50 hover:text-white hover:bg-white/5"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="mt-auto p-8 border-t border-white/5">
        <button 
          onClick={onLogout}
          className="flex items-center gap-3 text-white/40 hover:text-red-400 transition-colors text-sm font-medium w-full"
        >
          <X className="w-5 h-5" />
          Sair
        </button>
      </div>
    </aside>
  );
};
