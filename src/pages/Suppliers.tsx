import { useState } from "react";
import { Truck, Plus, ExternalLink, Trash2, Search, X, Check } from "lucide-react";
import { useSuppliers, useAddSupplier, useDeleteSupplier } from "../hooks/useSuppliers";
import { motion, AnimatePresence } from "motion/react";

const PRE_REGISTERED_SUPPLIERS = [
  { name: "Hayamax", category: "Eletrônicos & TI", link: "https://www.hayamax.com.br", image: "https://www.hayamax.com.br/arquivos/logo-hayamax.png" },
  { name: "Luxo24h", category: "Relógios & Acessórios", link: "https://www.luxo24h.com.br", image: "https://luxo24h.com.br/wp-content/uploads/2021/04/logo-luxo24h.png" },
  { name: "Montink", category: "Print on Demand", link: "https://www.montink.com", image: "https://www.montink.com/static/montink/img/logo.png" },
  { name: "Nacional Drop", category: "Variados & Utilidades", link: "https://nacionaldrop.com.br", image: "https://nacionaldrop.com.br/wp-content/uploads/2022/02/cropped-Logo_Nacional_Drop_Transparente-1.png" },
  { name: "Dalla Makeup", category: "Beleza & Cosméticos", link: "https://dallamakeup.com.br", image: "https://dallamakeup.com.br/wp-content/uploads/2022/07/logo-dalla.png" },
];

export const Suppliers = () => {
  const { data: userSuppliers = [] } = useSuppliers();
  const addSupplier = useAddSupplier();
  const deleteSupplier = useDeleteSupplier();

  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ name: "", link: "", type: "" });
  const [searchTerm, setSearchTerm] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.link) return;
    
    addSupplier.mutate(formData, {
      onSuccess: () => {
        setIsAdding(false);
        setFormData({ name: "", link: "", type: "" });
      }
    });
  };

  const filteredSuppliers = PRE_REGISTERED_SUPPLIERS.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111113] border border-white/10 w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl relative"
            >
              <button 
                onClick={() => setIsAdding(false)}
                className="absolute top-8 right-8 text-white/40 hover:text-white"
              >
                <X />
              </button>

              <div className="p-10">
                 <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-indigo-600/20 rounded-2xl flex items-center justify-center text-indigo-400">
                       <Plus className="w-6 h-6" />
                    </div>
                    <div>
                       <h2 className="text-2xl font-bold text-white uppercase italic tracking-tighter">Novo Fornecedor</h2>
                       <p className="text-white/40 text-sm">Adicione um fornecedor personalizado.</p>
                    </div>
                 </div>

                 <form onSubmit={handleAdd} className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Nome do Fornecedor</label>
                       <input 
                         type="text"
                         required
                         value={formData.name}
                         onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                         className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl outline-none focus:border-indigo-500 transition-colors text-white"
                         placeholder="Ex: Fornecedor VIP"
                       />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Link / Website</label>
                       <input 
                         type="url"
                         required
                         value={formData.link}
                         onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                         className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl outline-none focus:border-indigo-500 transition-colors text-white"
                         placeholder="https://..."
                       />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Tipo / Categoria</label>
                       <select 
                         value={formData.type}
                         onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                         className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl outline-none focus:border-indigo-500 transition-colors text-white appearance-none"
                       >
                          <option value="">Selecione...</option>
                          <option value="Dropshipping">Dropshipping</option>
                          <option value="Atacado">Atacado</option>
                          <option value="Fabricante">Fabricante</option>
                          <option value="Importação">Importação</option>
                       </select>
                    </div>

                    <button 
                      type="submit"
                      disabled={addSupplier.isPending}
                      className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-50"
                    >
                      {addSupplier.isPending ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Check className="w-5 h-5" />
                          Salvar Fornecedor
                        </>
                      )}
                    </button>
                 </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 italic tracking-tighter uppercase">Fornecedores</h1>
          <p className="text-white/50">Gerencie seus parceiros logísticos e fontes de produtos.</p>
        </div>
        
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Adicionar Fornecedor
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-[#111113] border border-white/10 rounded-[2.5rem] p-10 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between gap-4 mb-10">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-600/20 rounded-2xl flex items-center justify-center text-indigo-400">
                     <Truck className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold text-white italic uppercase tracking-tighter">Meus Fornecedores</h2>
               </div>
            </div>

            {userSuppliers.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl">
                 <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-white/20">
                    <Truck className="w-8 h-8" />
                 </div>
                 <p className="text-white/30 text-sm">Você ainda não adicionou fornecedores personalizados.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userSuppliers.map((supplier) => (
                  <div key={supplier.id} className="bg-white/5 border border-white/5 rounded-[2rem] p-6 group hover:border-indigo-500/30 transition-all flex flex-col justify-between">
                     <div>
                        <div className="flex justify-between items-start mb-4">
                           <span className="text-[8px] font-black uppercase tracking-[0.2em] px-2 py-1 bg-indigo-600/20 text-indigo-400 rounded-lg">
                              {supplier.type || 'Fornecedor'}
                           </span>
                           <button 
                             onClick={() => deleteSupplier.mutate(supplier.id)}
                             className="text-white/10 hover:text-red-500 transition-colors"
                           >
                              <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">{supplier.name}</h3>
                        <p className="text-white/30 text-[10px] truncate mb-6">{supplier.link}</p>
                     </div>
                     <a 
                       href={supplier.link}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                     >
                       <ExternalLink className="w-3 h-3" />
                       Visitar Site
                     </a>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="bg-[#111113]/50 border border-white/10 rounded-[2.5rem] p-10 shadow-xl space-y-8">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                   <h2 className="text-xl font-bold text-white italic uppercase tracking-tighter">Top Fornecedores Brasil</h2>
                   <p className="text-white/40 text-xs mt-1">Lista curada de melhores fontes nacionais.</p>
                </div>
                <div className="relative w-full md:w-64">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                   <input 
                     type="text" 
                     placeholder="Buscar fornecedores..." 
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="w-full bg-white/5 border border-white/5 p-3 pl-12 rounded-xl text-xs outline-none focus:border-indigo-500 text-white"
                   />
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredSuppliers.map((s, idx) => (
                  <div key={idx} className="bg-white/5 border border-white/5 rounded-3xl p-6 flex items-center gap-6 hover:bg-white/10 transition-all group">
                     <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center overflow-hidden p-2 group-hover:scale-105 transition-transform">
                        <img 
                          src={s.image} 
                          alt={s.name} 
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => {
                             e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=6366f1&color=fff`;
                          }}
                        />
                     </div>
                     <div className="flex-1">
                        <h4 className="font-bold text-white mb-0.5">{s.name}</h4>
                        <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">{s.category}</p>
                        <div className="flex items-center gap-3 mt-4">
                           <a 
                             href={s.link}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="text-[10px] font-black text-white/40 hover:text-white uppercase tracking-widest flex items-center gap-1 transition-colors"
                           >
                              <ExternalLink className="w-3 h-3" />
                              Ver Catálogo
                           </a>
                           <div className="h-1 w-1 bg-white/10 rounded-full" />
                           <button className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest transition-colors">
                              Integrar
                           </button>
                        </div>
                     </div>
                  </div>
                ))}
             </div>
          </section>
        </div>

        <aside className="space-y-8">
           <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-white/10 rounded-[2.5rem] p-8 space-y-6 shadow-2xl relative overflow-hidden">
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/5 blur-[40px] rounded-full" />
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Dica Estratégica</p>
              <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">O Segredo do Local Stock</h3>
              <p className="text-white/40 text-xs leading-relaxed">
                Utilizar fornecedores nacionais permite entregas em 2-5 dias úteis, reduzindo drasticamente o chargeback e aumentando o LTV dos seus clientes.
              </p>
              <div className="pt-4 border-t border-white/5 flex items-center gap-4">
                 <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black italic">!</div>
                 <p className="text-[10px] text-white/60 font-medium">Priorize fornecedores com rastreio imediato.</p>
              </div>
           </div>

           <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 space-y-6">
              <h3 className="font-black text-xs uppercase tracking-widest text-white/50">Status de Integração</h3>
              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <span className="text-xs text-white/40">Sincronização de Estoque</span>
                    <span className="text-[10px] font-black text-green-500 uppercase tracking-widest px-2 py-1 bg-green-500/10 rounded-lg">Online</span>
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="text-xs text-white/40">Processamento de Pedidos</span>
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest px-2 py-1 bg-indigo-500/10 rounded-lg">Manual</span>
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="text-xs text-white/40">Tracking Automático</span>
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest px-2 py-1 bg-indigo-500/10 rounded-lg">Disponível</span>
                 </div>
              </div>
           </div>
        </aside>
      </div>
    </div>
  );
};
