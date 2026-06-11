import { AlertTriangle, Trash2, CheckCircle2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  warningText?: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'success';
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  warningText,
  confirmText = 'Excluir',
  cancelText = 'Cancelar',
  type = 'danger'
}: ConfirmModalProps) {
  if (!isOpen) return null;

  // Icon mapping based on type
  const renderIcon = () => {
    switch (type) {
      case 'warning':
        return (
          <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-4 animate-bounce-short">
            <AlertTriangle className="w-6 h-6" />
          </div>
        );
      case 'success':
        return (
          <div className="w-12 h-12 rounded-full bg-green-50 border border-green-100 flex items-center justify-center text-green-600 mb-4">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        );
      case 'danger':
      default:
        return (
          <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-600 mb-4">
            <Trash2 className="w-5 h-5" />
          </div>
        );
    }
  };

  // Button mapping based on type
  const getConfirmButtonClass = () => {
    switch (type) {
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-800 text-white';
      case 'success':
        return 'bg-green-600 hover:bg-green-800 text-white';
      case 'danger':
      default:
        return 'bg-rose-600 hover:bg-rose-800 text-white'; // Uses Rose theme color for deletes
    }
  };

  return (
    <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-[70] flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div 
        className="bg-white rounded-[14px] border border-border shadow-xl w-full max-w-sm overflow-hidden p-6 flex flex-col items-center text-center animate-slide-up relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button Top Right */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-text-secondary hover:text-rose-600 transition-colors p-1 rounded-full hover:bg-bg"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Dynamic Icon */}
        {renderIcon()}

        {/* Title */}
        <h3 className="font-title font-semibold text-lg text-text-primary mb-2">
          {title}
        </h3>

        {/* Description */}
        <p className="text-xs text-text-secondary leading-relaxed mb-4 whitespace-pre-wrap">
          {description}
        </p>

        {/* Warning Banner */}
        {warningText && (
          <div className="w-full flex items-center gap-2 p-3 bg-amber-50/50 border border-amber-100 rounded-lg text-left text-[11px] text-amber-800 font-semibold mb-5">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>{warningText}</span>
          </div>
        )}

        {/* Actions buttons */}
        <div className="grid grid-cols-2 gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-border hover:bg-bg text-text-secondary rounded-lg text-xs font-semibold cursor-pointer transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${getConfirmButtonClass()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
