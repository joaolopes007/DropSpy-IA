import { Trash2 } from "lucide-react";
import { useSavedProducts, useUnsaveProduct } from "../hooks/useProducts";
import { Link } from "react-router-dom";
import { formatDate } from "../lib/formatters";

export const Saved = () => {
  const { data: saved = [], isLoading } = useSavedProducts();
  const unsave = useUnsaveProduct();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Seus Favoritos</h1>
        <p className="text-white/50">Produtos que você separou para sua loja.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : saved.length === 0 ? (
        <div className="text-center py-32 bg-white/5 border border-dashed border-white/10 rounded-3xl">
          <h2 className="text-xl font-bold text-white mb-2">Sua lista está vazia</h2>
          <p className="text-white/40 mb-8 max-w-sm mx-auto">Explore novos produtos e clique no botão de "Salvar" para vê-los aqui.</p>
          <Link to="/explore" className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold transition-all">
            Explorar Produtos
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {saved.map((item: { id: string; productName: string; productImage: string; savedAt: { toDate: () => Date } }) => (
            <div key={item.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden group hover:border-indigo-500/50 transition-all flex flex-col">
               <div className="relative aspect-square">
                 <img 
                   src={item.productImage} 
                   className="w-full h-full object-cover" 
                   referrerPolicy="no-referrer"
                   onError={(e) => {
                     const img = e.currentTarget;
                     img.src = "https://http2.mlstatic.com/D_NQ_NP_612260-MLA49455322444_032022-O.webp";
                   }}
                 />
                 <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <button 
                      onClick={() => unsave.mutate(item.id)}
                      className="p-3 bg-red-500 text-white rounded-full hover:scale-110 transition-transform"
                      title="Remover"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                 </div>
               </div>
               <div className="p-4">
                  <h3 className="font-bold text-white text-sm mb-1 truncate">{item.productName}</h3>
                  <div className="text-[10px] text-white/40 uppercase font-black">Salvo em {formatDate(item.savedAt?.toDate())}</div>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
