import { XMarkIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

interface DrawerItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

interface MobileMenuDrawerProps {
  open: boolean;
  onClose: () => void;
  items: DrawerItem[];
}

const MobileMenuDrawer = ({ open, onClose, items }: MobileMenuDrawerProps) => {
  const navigate = useNavigate();

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-50 lg:hidden"
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden animate-slide-up">
        <div className="bg-white rounded-t-2xl shadow-2xl max-h-[70vh] overflow-y-auto">
          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-slate-300" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700">Thêm</h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Items */}
          <div className="p-3 space-y-1">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    onClose();
                    navigate(item.path);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-all active:scale-[0.98]"
                >
                  <Icon className="w-5 h-5 text-slate-400" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileMenuDrawer;
