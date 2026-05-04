import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Privacy = () => {
  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-20">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-12 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Voltar para Home
        </Link>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-12"
        >
          <header>
            <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter mb-6">Política de Privacidade</h1>
            <p className="text-white/40 font-medium">Última atualização: 03 de Maio de 2026</p>
          </header>

          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-indigo-400">1. Coleta de Dados</h2>
            <p className="text-white/60 leading-relaxed">
              Coletamos informações que você nos fornece diretamente ao se cadastrar, como nome, endereço de e-mail e informações de pagamento. Também podemos coletar dados automaticamente sobre seu uso da plataforma e preferências de navegação.
            </p>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-indigo-400">2. Uso das Informações</h2>
            <p className="text-white/60 leading-relaxed">
              Utilizamos seus dados para fornecer, manter e melhorar nossos serviços, processar pagamentos, enviar notificações importantes e personalizar sua experiência com IA. Seus dados nunca são vendidos a terceiros.
            </p>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-indigo-400">3. Compartilhamento de Dados</h2>
            <p className="text-white/60 leading-relaxed">
              Compartilhamos informações com provedores de serviços essenciais, como processadores de pagamento (Stripe/MP) e serviços de autenticação (Google). Podemos ser obrigados a compartilhar dados por força de lei ou ordem judicial.
            </p>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-indigo-400">4. Cookies</h2>
            <p className="text-white/60 leading-relaxed">
              Utilizamos cookies para manter sua sessão ativa, entender como você interage com o site e lembrar suas preferências. Você pode gerenciar ou desativar cookies através das configurações do seu navegador.
            </p>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-indigo-400">5. Segurança</h2>
            <p className="text-white/60 leading-relaxed">
              Implementamos medidas de segurança técnicas e organizacionais para proteger seus dados contra acesso não autorizado, perda ou alteração. No entanto, nenhum sistema na internet é 100% seguro.
            </p>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-indigo-400">6. Direitos do Usuário</h2>
            <p className="text-white/60 leading-relaxed">
              Você tem direito a acessar, corrigir, excluir ou exportar seus dados pessoais de acordo com a LGPD. Essas solicitações podem ser feitas diretamente nas configurações da conta ou via suporte.
            </p>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-indigo-400">7. Alterações na Política</h2>
            <p className="text-white/60 leading-relaxed">
              Esta política pode ser atualizada conforme necessário. Notificaremos os usuários sobre mudanças significativas através do e-mail cadastrado ou avisos na plataforma.
            </p>
          </section>

          <footer className="pt-20 border-t border-white/10">
            <p className="text-white/40">Preocupado com sua privacidade? Fale conosco: <span className="text-white">privacidade@dropspy.ai</span></p>
          </footer>
        </motion.div>
      </div>
    </div>
  );
};
