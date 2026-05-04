import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Terms = () => {
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
            <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter mb-6">Termos de Uso</h1>
            <p className="text-white/40 font-medium">Última atualização: 03 de Maio de 2026</p>
          </header>

          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-indigo-400">1. Introdução</h2>
            <p className="text-white/60 leading-relaxed">
              Bem-vindo ao DropSpy AI. Estes termos de uso ("Termos") regem o acesso e uso da nossa plataforma de software como serviço (SaaS), projetada para automação de anúncios e inteligência competitiva em e-commerce.
            </p>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-indigo-400">2. Aceitação dos Termos</h2>
            <p className="text-white/60 leading-relaxed">
              Ao criar uma conta ou utilizar nossos serviços, você concorda plenamente com estes Termos. Se você não concorda com qualquer parte deste documento, não deve utilizar a plataforma.
            </p>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-indigo-400">3. Descrição do Serviço</h2>
            <p className="text-white/60 leading-relaxed">
              O DropSpy AI oferece ferramentas de mineração de produtos, análise de concorrência, calculadora de taxas e integração com marketplaces. Reservamo-nos o direito de modificar, suspender ou descontinuar qualquer aspecto do serviço a qualquer momento.
            </p>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-indigo-400">4. Responsabilidades do Usuário</h2>
            <p className="text-white/60 leading-relaxed">
              Você é responsável por manter a confidencialidade de sua conta e senha. Você concorda em não utilizar a plataforma para atividades ilegais, fraudulentas ou que violem os direitos de terceiros, incluindo direitos de propriedade intelectual.
            </p>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-indigo-400">5. Assinaturas e Pagamentos</h2>
            <p className="text-white/60 leading-relaxed">
              O acesso às funcionalidades da plataforma depende da manutenção de uma assinatura ativa. Os pagamentos são recorrentes e cobrados antecipadamente. Falhas no pagamento podem resultar na suspensão imediata do acesso aos recursos do sistema.
            </p>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-indigo-400">6. Limitação de Responsabilidade</h2>
            <p className="text-white/60 leading-relaxed">
              O DropSpy AI fornece dados e automações baseadas em algoritmos. Não garantimos resultados financeiros específicos, vendas ou lucro. O uso das informações obtidas na plataforma é de inteira responsabilidade do usuário.
            </p>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-indigo-400">7. Cancelamento</h2>
            <p className="text-white/60 leading-relaxed">
              Você pode cancelar sua assinatura a qualquer momento através das configurações da conta. O cancelamento interrompe a renovação automática, mas não gera reembolso proporcional por períodos já pagos e não utilizados.
            </p>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-indigo-400">8. Modificações dos Termos</h2>
            <p className="text-white/60 leading-relaxed">
              Podemos atualizar estes Termos periodicamente. O uso continuado da plataforma após alterações constitui aceitação dos novos termos.
            </p>
          </section>

          <footer className="pt-20 border-t border-white/10">
            <p className="text-white/40">Dúvidas sobre os Termos de Uso? Entre em contato: <span className="text-white">suporte@dropspy.ai</span></p>
          </footer>
        </motion.div>
      </div>
    </div>
  );
};
