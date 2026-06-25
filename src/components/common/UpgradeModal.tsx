import { useNavigate } from 'react-router-dom';
import { X, Sparkles, Check, ChevronRight } from 'lucide-react';
import Modal from './Modal';

interface UpgradeModalProps {
  onClose: () => void;
}

export default function UpgradeModal({ onClose }: UpgradeModalProps) {
  const navigate = useNavigate();

  return (
    <Modal>
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl border border-rose-100 shadow-2xl w-full max-w-md overflow-hidden animate-slide-up relative">
        {/* Background decorative gradients */}
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-br from-rose-100/40 via-purple-50/10 to-transparent pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-secondary hover:text-rose-600 hover:bg-rose-50 p-1 rounded-full transition-colors cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 md:p-8 flex flex-col items-center text-center relative">
          {/* Premium Icon Badge */}
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-rose-200 mb-4 animate-bounce-subtle">
            <Sparkles className="w-7 h-7" />
          </div>

          <span className="text-[10px] font-bold tracking-widest text-rose-600 uppercase px-2.5 py-1 bg-rose-50 border border-rose-100 rounded-full mb-2">
            Recurso Premium
          </span>

          <h3 className="font-title font-bold text-2xl text-text-primary mb-2">
            Agenda & Horários Online
          </h3>

          <p className="text-sm text-text-secondary mb-6 leading-relaxed">
            Faça o upgrade para o plano <strong className="text-rose-600 font-semibold">Premium</strong> e automatize a agenda do seu negócio. Permita que suas clientes façam agendamentos sozinhas de forma simples e intuitiva.
          </p>

          {/* Perks List */}
          <ul className="w-full space-y-3 text-left bg-rose-50/30 border border-rose-100/50 rounded-xl p-4 mb-6">
            <li className="flex items-start gap-2.5 text-xs text-text-primary">
              <span className="p-0.5 rounded-full bg-green-100 text-green-600 flex-shrink-0 mt-0.5">
                <Check className="w-3 h-3" />
              </span>
              <span>Portal de agendamento online personalizado</span>
            </li>
            <li className="flex items-start gap-2.5 text-xs text-text-primary">
              <span className="p-0.5 rounded-full bg-green-100 text-green-600 flex-shrink-0 mt-0.5">
                <Check className="w-3 h-3" />
              </span>
              <span>Controle completo de horários e bloqueios na agenda</span>
            </li>
            <li className="flex items-start gap-2.5 text-xs text-text-primary">
              <span className="p-0.5 rounded-full bg-green-100 text-green-600 flex-shrink-0 mt-0.5">
                <Check className="w-3 h-3" />
              </span>
              <span>Configuração de duração e variações de preços</span>
            </li>
          </ul>

          {/* Actions */}
          <div className="w-full flex flex-col gap-2">
            <button
              onClick={() => {
                onClose();
                navigate('/assinatura');
              }}
              className="w-full py-3 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-md shadow-rose-100 hover:shadow-lg cursor-pointer flex items-center justify-center gap-1"
            >
              <span>Fazer Upgrade no Painel</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="w-full py-2.5 border border-border hover:bg-bg rounded-xl text-xs font-medium text-text-secondary transition-all cursor-pointer"
            >
              Agora Não
            </button>
          </div>
        </div>
      </div>
    </div>
    </Modal>
  );
}
