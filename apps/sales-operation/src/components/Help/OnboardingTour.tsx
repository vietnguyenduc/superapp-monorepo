import React, { useState, useEffect, useCallback } from 'react';
import {
  XMarkIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

interface TourStep {
  target: string;
  title: string;
  description: string;
  position: 'bottom' | 'top' | 'left' | 'right';
}

const tourSteps: TourStep[] = [
  {
    target: '[data-tour="dashboard"]',
    title: 'Dashboard',
    description: 'Xem tổng quan tồn kho, sản phẩm và báo cáo nhanh.',
    position: 'bottom',
  },
  {
    target: '[data-tour="product-entry"]',
    title: 'Nhập Sản Phẩm',
    description: 'Thêm sản phẩm mới (NVL, SC, TP) vào danh mục.',
    position: 'right',
  },
  {
    target: '[data-tour="inventory-entry"]',
    title: 'Nhập Tồn Kho',
    description: 'Ghi nhận số tồn NVL, SC, TP cho từng ngày.',
    position: 'right',
  },
  {
    target: '[data-tour="bulk-import"]',
    title: 'Import Hàng Loạt',
    description: 'Tải file Excel/CSV để nhập nhiều sản phẩm hoặc tồn kho cùng lúc (tối đa 200 dòng).',
    position: 'right',
  },
  {
    target: '[data-tour="export-reports"]',
    title: 'Xuất Báo Cáo',
    description: 'Xuất file kiểm kê kho để in hoặc lưu trữ.',
    position: 'right',
  },
  {
    target: '[data-tour="help"]',
    title: 'Trợ Giúp',
    description: 'Tìm hướng dẫn, FAQ và xử lý lỗi bất cứ lúc nào.',
    position: 'top',
  },
];

const TOUR_STORAGE_KEY = 'inventory-tour-completed';

const OnboardingTour: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const completed = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!completed) {
      const timer = setTimeout(() => setIsOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const calculatePosition = useCallback(() => {
    const step = tourSteps[currentStep];
    const el = document.querySelector(step.target);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const tooltipWidth = 320;
    const tooltipHeight = 140;
    const offset = 12;

    let top = 0;
    let left = 0;

    switch (step.position) {
      case 'bottom':
        top = rect.bottom + offset;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'top':
        top = rect.top - tooltipHeight - offset;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - offset;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + offset;
        break;
    }

    // Keep within viewport
    top = Math.max(8, Math.min(top, window.innerHeight - tooltipHeight - 8));
    left = Math.max(8, Math.min(left, window.innerWidth - tooltipWidth - 8));

    setTooltipPos({ top, left });

    // Highlight element
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [currentStep]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(calculatePosition, 100);
      window.addEventListener('resize', calculatePosition);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', calculatePosition);
      };
    }
  }, [isOpen, calculatePosition]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    setIsOpen(false);
    setCurrentStep(0);
  };

  const handleRestart = () => {
    localStorage.removeItem(TOUR_STORAGE_KEY);
    setCurrentStep(0);
    setIsOpen(true);
  };

  if (!isOpen) {
    return (
      <button
        onClick={handleRestart}
        className="fixed bottom-4 right-4 z-40 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        title="Bắt đầu tour hướng dẫn"
      >
        <SparklesIcon className="h-5 w-5" />
      </button>
    );
  }

  const step = tourSteps[currentStep];

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={handleComplete} />

      {/* Tooltip */}
      <div
        className="fixed z-50 bg-white rounded-xl shadow-2xl p-5 w-80 border border-gray-100"
        style={{ top: tooltipPos.top, left: tooltipPos.left }}
      >
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-gray-900">{step.title}</h3>
          <button
            onClick={handleComplete}
            className="text-gray-400 hover:text-gray-600 -mt-1 -mr-1"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-4">{step.description}</p>

        {/* Progress */}
        <div className="flex items-center gap-1.5 mb-4">
          {tourSteps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= currentStep ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {currentStep + 1} / {tourSteps.length}
          </span>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeftIcon className="h-4 w-4" />
                Trước
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
            >
              {currentStep === tourSteps.length - 1 ? 'Hoàn thành' : 'Tiếp'}
              {currentStep < tourSteps.length - 1 && (
                <ChevronRightIcon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default OnboardingTour;
