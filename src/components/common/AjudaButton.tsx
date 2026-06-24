import { HelpCircle } from 'lucide-react';
import { useOnboarding, type OnboardingPageKey } from '../../hooks/useOnboarding';

interface AjudaButtonProps {
  pageKey: OnboardingPageKey;
}

export default function AjudaButton({ pageKey }: AjudaButtonProps) {
  const { startTour } = useOnboarding(pageKey);

  return (
    <button
      onClick={startTour}
      title="Ajuda — ver tutorial desta tela"
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-text-secondary hover:text-rose-600 hover:border-rose-300 text-xs font-medium transition-colors cursor-pointer shrink-0"
    >
      <HelpCircle className="w-4 h-4" />
      Ajuda
    </button>
  );
}
