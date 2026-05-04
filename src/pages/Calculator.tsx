import { useState } from "react";
import { Calculator as CalcIcon, DollarSign, Percent, TrendingUp, Zap, HelpCircle, ArrowRight } from "lucide-react";
import { formatCurrency } from "../lib/formatters";

export const Calculator = () => {
  const [cost, setCost] = useState<number | "">("");
  const [price, setPrice] = useState<number | "">("");
  const [commissionType, setCommissionType] = useState<"percent" | "fixed">("percent");
  const [commissionValue, setCommissionValue] = useState<number | "">("");
  const [fixedFee, setFixedFee] = useState<number | "">("");

  const c = Number(cost) || 0;
  const p = Number(price) || 0;
  const commVal = Number(commissionValue) || 0;
  const fee = Number(fixedFee) || 0;

  const calculatedTotalComm = commissionType === "percent" 
    ? p * (commVal / 100) 
    : commVal;

  const netProfit = p - c - calculatedTotalComm - fee;
  const margin = p > 0 ? (netProfit / p) * 100 : 0;
  const roi = c > 0 ? (netProfit / c) * 100 : 0;
  const totalFees = calculatedTotalComm + fee;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 italic tracking-tighter uppercase">Calculadora de Vendas</h1>
          <p className="text-white/50">Precificação inteligente para máxima lucratividade.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 bg-[#111113] border border-white/10 rounded-[2.5rem] p-10 shadow-2xl space-y-8 h-fit">
           <div className="flex items-center gap-4 mb-2">
              <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center text-indigo-400">
                 <DollarSign className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-white uppercase italic tracking-tighter">Variáveis de Custo</h2>
           </div>

           <div className="space-y-6">
              <div className="space-y-2">
                 <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Preço de Custo (Produto)</label>
                    <HelpCircle className="w-3 h-3 text-white/20 cursor-help" />
                 </div>
                 <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 text-sm font-bold">R$</div>
                    <input 
                      type="number"
                      value={cost}
                      onChange={(e) => setCost(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full bg-white/5 border border-white/5 p-4 pl-12 rounded-2xl outline-none focus:border-indigo-500 transition-colors text-white text-lg font-bold"
                      placeholder="0,00"
                    />
                 </div>
              </div>

              <div className="space-y-2">
                 <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Preço de Venda Final</label>
                    <HelpCircle className="w-3 h-3 text-white/20 cursor-help" />
                 </div>
                 <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500/50 text-sm font-bold">R$</div>
                    <input 
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full bg-white/5 border border-white/5 p-4 pl-12 rounded-2xl outline-none focus:border-green-500 transition-colors text-white text-lg font-bold"
                      placeholder="0,00"
                    />
                 </div>
              </div>

              <div className="pt-6 border-t border-white/5 space-y-6">
                 <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-bold text-white uppercase italic tracking-tighter">Taxas & Comissões</h2>
                    <div className="flex bg-white/5 rounded-xl p-1">
                       <button 
                         onClick={() => setCommissionType("percent")}
                         className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${commissionType === "percent" ? "bg-indigo-600 text-white" : "text-white/30 hover:text-white"}`}
                       >
                          %
                       </button>
                       <button 
                         onClick={() => setCommissionType("fixed")}
                         className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${commissionType === "fixed" ? "bg-indigo-600 text-white" : "text-white/30 hover:text-white"}`}
                       >
                          $
                       </button>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Comissão Marketplace</label>
                       <div className="relative">
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 text-xs font-bold">{commissionType === "percent" ? "%" : "R$"}</div>
                          <input 
                            type="number"
                            value={commissionValue}
                            onChange={(e) => setCommissionValue(e.target.value === "" ? "" : Number(e.target.value))}
                            className="w-full bg-white/5 border border-white/5 p-4 pr-10 rounded-2xl outline-none focus:border-indigo-500 transition-colors text-white font-bold"
                            placeholder="0"
                          />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Taxas Fixas / Ads</label>
                       <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 text-xs font-bold">R$</div>
                          <input 
                            type="number"
                            value={fixedFee}
                            onChange={(e) => setFixedFee(e.target.value === "" ? "" : Number(e.target.value))}
                            className="w-full bg-white/5 border border-white/5 p-4 pl-10 rounded-2xl outline-none focus:border-indigo-500 transition-colors text-white font-bold"
                            placeholder="0"
                          />
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        <div className="lg:col-span-8 space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-indigo-600/10 to-transparent border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-[50px] rounded-full group-hover:bg-indigo-500/10 transition-colors" />
                 <div className="flex justify-between items-center mb-6">
                    <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center text-indigo-400">
                       <TrendingUp className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Lucro Líquido</span>
                 </div>
                 <div className="text-4xl font-black text-white italic tracking-tighter mb-1">
                    {formatCurrency(netProfit)}
                 </div>
                 <p className="text-white/30 text-xs font-medium italic">O que realmente entra no seu bolso.</p>
              </div>

              <div className="bg-gradient-to-br from-green-600/10 to-transparent border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-[50px] rounded-full group-hover:bg-green-500/10 transition-colors" />
                 <div className="flex justify-between items-center mb-6">
                    <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center text-green-400">
                       <Percent className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-green-400">Margem Líquida</span>
                 </div>
                 <div className="text-4xl font-black text-white italic tracking-tighter mb-1">
                    {margin.toFixed(1)}%
                 </div>
                 <p className="text-white/30 text-xs font-medium italic">Sua eficiência operacional.</p>
              </div>
           </div>
 
           <div className="bg-[#111113] border border-white/10 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
              <div className="flex items-center gap-4 mb-10">
                 <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white/40">
                    <Zap className="w-5 h-5" />
                 </div>
                 <h2 className="text-lg font-bold text-white uppercase italic tracking-tighter">Breakdown Geométrico</h2>
              </div>
 
              <div className="space-y-8">
                 <div className="flex items-center gap-6">
                    <div className="flex-1 space-y-4">
                       <div className="flex justify-between text-xs mb-1">
                          <span className="text-white/40 font-bold uppercase tracking-widest">Distribuição de Capital</span>
                          <span className="text-white font-black italic">{formatCurrency(Number(price) || 0)} (100%)</span>
                       </div>
                       <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden flex">
                          <div 
                            className="bg-indigo-600 h-full transition-all duration-500 group relative"
                            style={{ width: `${(Number(cost) / (Number(price) || 1)) * 100}%` }}
                          >
                             <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-indigo-600 text-[8px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">CUSTO</div>
                          </div>
                          <div 
                            className="bg-red-500/50 h-full transition-all duration-500 group relative"
                            style={{ width: `${(totalFees / (Number(price) || 1)) * 100}%` }}
                          >
                             <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-red-500 text-[8px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">TAXAS</div>
                          </div>
                          <div 
                            className="bg-green-500 h-full transition-all duration-500 group relative"
                            style={{ width: `${(Math.max(0, netProfit) / (Number(price) || 1)) * 100}%` }}
                          >
                             <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-green-500 text-[8px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">LUCRO</div>
                          </div>
                       </div>
                    </div>
                 </div>
 
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 border-t border-white/5">
                    <div className="space-y-1">
                       <div className="text-[10px] text-white/30 uppercase font-black tracking-widest">Markup</div>
                       <div className="text-xl font-black text-white italic tracking-tighter">
                          {cost && price ? ((Number(price) / Number(cost)).toFixed(2)) : '0.00'}x
                       </div>
                    </div>
                    <div className="space-y-1">
                       <div className="text-[10px] text-white/30 uppercase font-black tracking-widest">ROI (Retorno sobre Invest.)</div>
                       <div className={`text-xl font-black italic tracking-tighter ${roi >= 100 ? 'text-green-500' : 'text-white'}`}>
                          {roi.toFixed(1)}%
                       </div>
                    </div>
                    <div className="space-y-1">
                       <div className="text-[10px] text-white/30 uppercase font-black tracking-widest">Custo Operacional Total</div>
                       <div className="text-xl font-black text-red-500 italic tracking-tighter">
                          {formatCurrency(totalFees)}
                       </div>
                    </div>
                 </div>
              </div>
           </div>
 
           <div className="bg-indigo-600/10 border border-indigo-600/20 rounded-[2rem] p-8 flex items-center justify-between group">
              <div className="flex items-center gap-6">
                 <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                    <CalcIcon className="w-6 h-6" />
                 </div>
                 <div>
                    <h4 className="text-lg font-bold text-white uppercase italic tracking-tighter">Análise de IA: Viabilidade</h4>
                    <p className="text-white/40 text-xs">
                       {margin > 30 
                         ? "Margem excelente para escala agressiva com tráfego pago." 
                         : margin > 15 
                           ? "Margem saudável. Otimize custos de ads para manter escala." 
                           : "Margem apertada. Recomendamos renegociar com fornecedor."}
                    </p>
                 </div>
              </div>
              <ArrowRight className="w-6 h-6 text-indigo-400 group-hover:translate-x-2 transition-transform" />
           </div>
        </div>
      </div>
    </div>
  );
};
