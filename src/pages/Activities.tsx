import { useState, useMemo } from "react";
import { 
  History, 
  Search, 
  Filter, 
  ChevronDown, 
  User, 
  Zap, 
  Box, 
  Link2, 
  Clock,
  Settings,
  X,
  Shield
} from "lucide-react";
import { useActivityLogs, ActivityType, ActivityLog } from "../hooks/useActivityLogs";
import { motion } from "motion/react";
import { format, isToday, isYesterday, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Activities = () => {
  const { data: logs = [], isLoading } = useActivityLogs();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<ActivityType | "all">("all");
  const [visibleCount, setVisibleCount] = useState(20);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = 
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
        log.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedType === "all" || log.type === selectedType;
      return matchesSearch && matchesType;
    });
  }, [logs, searchTerm, selectedType]);

  const groupedLogs = useMemo(() => {
    const groups: { [key: string]: ActivityLog[] } = {};
    
    filteredLogs.slice(0, visibleCount).forEach(log => {
      const date = log.created_at.toDate();
      const key = isToday(date) 
        ? "Hoje" 
        : isYesterday(date) 
          ? "Ontem" 
          : format(date, "d 'de' MMMM", { locale: ptBR });
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(log);
    });
    
    return groups;
  }, [filteredLogs, visibleCount]);

  const getTypeIcon = (type: ActivityType) => {
    switch (type) {
      case 'auth': return <Shield className="w-4 h-4 text-green-400" />;
      case 'product': return <Box className="w-4 h-4 text-orange-400" />;
      case 'integration': return <Link2 className="w-4 h-4 text-blue-400" />;
      case 'subscription': return <Zap className="w-4 h-4 text-purple-400" />;
      case 'supplier': return <User className="w-4 h-4 text-pink-400" />;
      case 'system': return <Settings className="w-4 h-4 text-indigo-400" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTypeLabel = (type: ActivityType) => {
    switch (type) {
      case 'auth': return 'Autenticação';
      case 'product': return 'Produtos';
      case 'integration': return 'Integrações';
      case 'subscription': return 'Assinatura';
      case 'supplier': return 'Fornecedores';
      case 'system': return 'Sistema';
      default: return type;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
        <div>
          <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-2">Histórico</h1>
          <p className="text-white/40 font-medium">Acompanhe todas as atividades realizadas na sua conta.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
           {/* Search */}
           <div className="relative w-full md:w-80 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-indigo-400 transition-colors" />
              <input 
                type="text" 
                placeholder="Buscar atividades..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 p-3.5 pl-12 rounded-2xl outline-none focus:border-indigo-500/50 transition-all text-white placeholder:text-white/20 text-sm"
              />
           </div>

           {/* Filter */}
           <div className="relative inline-block">
              <select 
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as ActivityType | "all")}
                className="appearance-none bg-white/5 border border-white/10 px-6 py-3.5 pr-12 rounded-2xl outline-none focus:border-indigo-500/50 transition-all text-white text-sm font-medium cursor-pointer"
              >
                <option value="all">Filtrar por Tipo</option>
                <option value="auth">Autenticação</option>
                <option value="product">Produtos</option>
                <option value="integration">Integrações</option>
                <option value="subscription">Assinatura</option>
                <option value="supplier">Fornecedores</option>
                <option value="system">Sistema</option>
              </select>
              <Filter className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
           </div>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-6">
           <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
           <p className="text-white/20 font-black uppercase tracking-[0.2em] text-[10px]">Carregando Atividades</p>
        </div>
      ) : filteredLogs.length > 0 ? (
        <div className="space-y-12">
           {Object.keys(groupedLogs).map((groupKey) => (
             <div key={groupKey} className="space-y-6">
                <div className="flex items-center gap-4">
                   <h3 className="text-sm font-black text-white/30 uppercase tracking-widest">{groupKey}</h3>
                   <div className="h-px flex-1 bg-white/5" />
                </div>

                <div className="space-y-3">
                   {groupedLogs[groupKey].map((log) => (
                     <motion.div 
                       key={log.id}
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       className="group bg-[#111113] border border-white/5 hover:border-indigo-500/30 p-6 rounded-[2rem] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-all shadow-xl"
                     >
                        <div className="flex items-center gap-6">
                           <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 bg-white/5 border border-white/5 group-hover:scale-105 transition-transform`}>
                              {getTypeIcon(log.type)}
                           </div>
                           <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-3">
                                 <h4 className="text-lg font-black text-white italic tracking-tighter uppercase">{log.action}</h4>
                                 <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-black text-white/30 uppercase tracking-widest">
                                    {getTypeLabel(log.type)}
                                 </span>
                              </div>
                              <p className="text-white/40 text-sm font-medium leading-relaxed max-w-2xl">
                                 {log.description}
                              </p>
                           </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2 text-right w-full md:w-auto">
                           <div className="flex items-center gap-2 text-white/20">
                              <Clock className="w-3 h-3" />
                              <span className="text-[10px] font-black uppercase tracking-widest">
                                 {format(log.created_at.toDate(), "HH:mm")}
                              </span>
                           </div>
                           <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-500/5 px-3 py-1 rounded-full border border-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity">
                              {formatDistanceToNow(log.created_at.toDate(), { addSuffix: true, locale: ptBR })}
                           </span>
                        </div>
                     </motion.div>
                   ))}
                </div>
             </div>
           ))}

           {visibleCount < filteredLogs.length && (
             <div className="flex justify-center pt-8">
                <button 
                  onClick={() => setVisibleCount(visibleCount + 20)}
                  className="px-12 py-5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all flex items-center gap-3 active:scale-95"
                >
                   <ChevronDown className="w-4 h-4" />
                   Carregar Mais Atividades
                </button>
             </div>
           )}
        </div>
      ) : (
        <div className="py-32 text-center flex flex-col items-center gap-8">
           <div className="w-24 h-24 bg-white/5 rounded-[3rem] flex items-center justify-center text-white/10 relative group">
              <div className="absolute inset-0 bg-indigo-500/5 blur-[40px] rounded-full group-hover:bg-indigo-500/10 transition-colors" />
              <History className="w-10 h-10 relative" />
           </div>
           <div className="space-y-2">
              <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Nenhuma Atividade</h3>
              <p className="text-white/30 text-sm font-medium max-w-sm mx-auto">
                 Sua conta ainda não possui registros. Realize ações na plataforma para começar a rastrear sua jornada.
              </p>
           </div>
           {(searchTerm || selectedType !== "all") && (
             <button 
               onClick={() => { setSearchTerm(""); setSelectedType("all"); }}
               className="flex items-center gap-2 text-indigo-400 font-black uppercase tracking-widest text-[10px] hover:text-indigo-300 transition-colors"
             >
                <X className="w-3 h-3" />
                Limpar Filtros
             </button>
           )}
        </div>
      )}
    </div>
  );
};
