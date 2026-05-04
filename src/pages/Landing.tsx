import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Search, 
  Zap, 
  ShieldCheck, 
  Globe, 
  ArrowRight,
  Menu,
  X
} from "lucide-react";
import { Link } from "react-router-dom";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 py-6 ${
        isScrolled ? "bg-black/80 backdrop-blur-xl border-b border-white/5 py-4" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 group cursor-pointer">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
            <Search className="text-white w-5 h-5" />
          </div>
          <span className="text-2xl font-black text-white tracking-tighter">DropSpy <span className="text-indigo-500">AI</span></span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {["Recursos", "Como Funciona", "Depoimentos"].map((item) => (
            <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`} className="text-sm font-bold text-white/60 hover:text-white transition-colors">
              {item}
            </a>
          ))}
          <Link 
            to="/login"
            className="px-6 py-2.5 bg-white text-black text-sm font-bold rounded-full hover:bg-neutral-200 transition-colors"
          >
            Entrar
          </Link>
        </div>

        <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-0 right-0 bg-black border-b border-white/5 p-6 md:hidden flex flex-col gap-6"
        >
          {["Recursos", "Como Funciona", "Depoimentos"].map((item) => (
            <a key={item} href="#" className="text-lg font-bold text-white/60">
              {item}
            </a>
          ))}
          <Link 
            to="/register"
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-center"
          >
            Começar Agora
          </Link>
        </motion.div>
      )}
    </nav>
  );
};

const Hero = () => {
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-500/10 blur-[120px] rounded-full -z-10" />
      <div className="max-w-7xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-indigo-400 text-xs font-bold uppercase tracking-widest mb-8">
            🔥 IA Treinada para Vendas (2026)
          </span>
          <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter mb-8 leading-[0.9]">
            Encontre Produtos de <br/>
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              6 Dígitos em Segundos
            </span>
          </h1>
          <p className="text-white/60 text-lg md:text-2xl max-w-2xl mx-auto mb-12 font-medium">
            Pare de testar no escuro. Nossa IA analisa milhões de anúncios para encontrar os produtos vencedores antes que saturem.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link 
                to="/register"
                className="px-10 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full font-bold text-lg shadow-xl shadow-indigo-500/20 flex items-center gap-3 group"
              >
                Garantir Acesso Ilimitado
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="mt-20 relative px-4"
        >
          <div className="max-w-5xl mx-auto p-2 bg-white/5 border border-white/10 rounded-[2.5rem] backdrop-blur-sm shadow-2xl relative group">
            <img 
              src="https://images.unsplash.com/photo-1642104704074-907c0698cbd9?auto=format&fit=crop&q=80&w=2000" 
              alt="DropSpy Dashboard" 
              className="w-full rounded-[2rem] grayscale group-hover:grayscale-0 transition-all duration-1000"
              referrerPolicy="no-referrer"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// Simplified versions of other sections to keep code clean for now
const Benefits = () => (
  <section id="recursos" className="py-24 max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
    {[
      { icon: <Zap />, title: "IA de Alta Velocidade", desc: "Analisamos tendências em tempo real no TikTok, Meta e Google." },
      { icon: <ShieldCheck />, title: "Dados Verificados", desc: "Acesso a faturamento real e escala de anúncios dos concorrentes." },
      { icon: <Globe />, title: "Fornecedores VIP", desc: "Conexão direta com agentes de dropshipping na China e Brasil." }
    ].map((b, i) => (
      <div key={i} className="group">
        <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-indigo-500 mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
          {b.icon}
        </div>
        <h3 className="text-xl font-bold text-white mb-4">{b.title}</h3>
        <p className="text-white/40 leading-relaxed">{b.desc}</p>
      </div>
    ))}
  </section>
);

export const Landing = () => {
  return (
    <div className="bg-black min-h-screen text-white selection:bg-indigo-500 selection:text-white font-sans overflow-x-hidden">
      <Navbar />
      <Hero />
      <Benefits />
      <section className="py-24 bg-white/5 border-y border-white/5">
         <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold mb-8">Nossa base de dados cresce a cada minuto</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { l: "Produtos minerados", v: "1.2M+" },
                { l: "Anúncios analisados", v: "450k+" },
                { l: "Vendedores ativos", v: "2.5k+" },
                { l: "Vendas geradas", v: "R$ 15M+" }
              ].map(s => (
                <div key={s.l}>
                  <div className="text-4xl font-black text-indigo-400 mb-2">{s.v}</div>
                  <div className="text-xs font-bold text-white/40 uppercase tracking-widest">{s.l}</div>
                </div>
              ))}
            </div>
         </div>
      </section>
      <footer className="py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-10">
           <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                <Search className="text-white w-4 h-4" />
              </div>
              <span className="text-xl font-bold">DropSpy <span className="text-indigo-500">AI</span></span>
           </div>
           <p className="text-white/40 text-sm">© 2026 DropSpy AI. Todos os direitos reservados.</p>
           <div className="flex gap-8">
             <Link to="/termos" className="text-white/40 hover:text-white text-sm font-medium transition-colors">Termos de Uso</Link>
             <Link to="/privacidade" className="text-white/40 hover:text-white text-sm font-medium transition-colors">Política de Privacidade</Link>
           </div>
        </div>
      </footer>
    </div>
  );
};
