import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Search, ArrowLeft } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";

export const Login = ({ mode }: { mode: "login" | "register" }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const { signIn, signUp, signInWithGoogle, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const validatePassword = (pass: string) => {
    const minLength = pass.length >= 6;
    const hasNumber = /\d/.test(pass);
    return minLength && hasNumber;
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError("Erro ao entrar com Google. Tente novamente.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (mode === "register") {
      if (!name || !email || !pass || !confirmPass) {
        setError("Preencha todos os campos");
        return;
      }
      if (!validateEmail(email)) {
        setError("Digite um e-mail válido");
        return;
      }
      if (!validatePassword(pass)) {
        setError("Senha deve ter no mínimo 6 caracteres e conter pelo menos 1 número");
        return;
      }
      if (pass !== confirmPass) {
        setError("As senhas não coincidem");
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await signIn(email, pass);
      } else {
        await signUp(email, pass, name);
        setSuccess("Conta criada com sucesso");
        return;
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Ocorreu um erro inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10 blur-[150px] rounded-full -z-10" />
      
      <Link to="/" className="absolute top-10 left-10 flex items-center gap-2 text-white/40 hover:text-white transition-colors group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Voltar
      </Link>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white/5 border border-white/10 p-10 rounded-[2.5rem] backdrop-blur-xl"
      >
        <div className="text-center mb-10">
           <div className="inline-flex items-center gap-2 mb-8">
              <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Search className="text-white w-5 h-5" />
              </div>
              <span className="text-2xl font-bold">DropSpy <span className="text-indigo-500">AI</span></span>
           </div>
           <h1 className="text-3xl font-black text-white mb-2">
             {mode === "login" ? "Bem-vindo" : "Crie sua conta"}
           </h1>
           <p className="text-white/40">
             {mode === "login" ? "Entre para continuar" : "Crie sua conta para acessar a plataforma"}
           </p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-medium"
          >
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-500 text-sm font-medium"
          >
            {success}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {mode === "register" && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/60 uppercase tracking-widest ml-1">Nome Completo</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                className={`w-full bg-white/5 border ${error && !name ? 'border-red-500' : 'border-white/5'} p-4 rounded-2xl outline-none focus:border-indigo-500 transition-colors text-white placeholder:text-white/20`} 
              />
            </div>
          )}
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/60 uppercase tracking-widest ml-1">E-mail</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className={`w-full bg-white/5 border ${error && (!email || !validateEmail(email)) ? 'border-red-500' : 'border-white/5'} p-4 rounded-2xl outline-none focus:border-indigo-500 transition-colors text-white placeholder:text-white/20`} 
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/60 uppercase tracking-widest ml-1">Senha</label>
            <input 
              type="password" 
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="••••••••"
              className={`w-full bg-white/5 border ${error && (!pass || (mode === 'register' && !validatePassword(pass))) ? 'border-red-500' : 'border-white/5'} p-4 rounded-2xl outline-none focus:border-indigo-500 transition-colors text-white placeholder:text-white/20`} 
            />
          </div>
          {mode === "register" && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/60 uppercase tracking-widest ml-1">Confirmar Senha</label>
              <input 
                type="password" 
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                placeholder="••••••••"
                className={`w-full bg-white/5 border ${error && (!confirmPass || pass !== confirmPass) ? 'border-red-500' : 'border-white/5'} p-4 rounded-2xl outline-none focus:border-indigo-500 transition-colors text-white placeholder:text-white/20`} 
              />
            </div>
          )}
          
          <button 
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                <span>{mode === "register" ? "Criando conta..." : "Entrando..."}</span>
              </>
            ) : mode === "login" ? "Entrar Agora" : "Criar Conta"}
          </button>

          <div className="relative py-4">
             <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
             </div>
             <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-black/20 backdrop-blur-xl px-2 text-white/30 font-bold tracking-widest">Ou continue com</span>
             </div>
          </div>

          <button 
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-5 bg-white hover:bg-gray-100 disabled:opacity-50 text-black rounded-2xl font-black uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Entrar com Google
          </button>
        </form>
        <div className="mt-8 text-center text-sm">
          <span className="text-white/40">
            {mode === "login" ? "Não tem uma conta?" : "Já tem uma conta?"}
          </span>
          <Link 
            to={mode === "login" ? "/register" : "/login"} 
            className="text-indigo-400 font-bold hover:underline ml-2"
          >
            {mode === "login" ? "Crie agora" : "Entre aqui"}
          </Link>
        </div>
      </motion.div>
    </div>
  );
};
