import React, { useState, useEffect, useRef } from 'react';

interface ProductOption {
  id: string;
  name: string;
  code: string;
  category?: string;
}

interface SearchableDropdownProps {
  value: string;
  onChange: (value: string, selectedOption?: ProductOption) => void;
  onCodeLookup?: (code: string) => void;
  onBulkPaste?: (items: string[]) => void;
  options: ProductOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  value,
  onChange,
  onCodeLookup,
  onBulkPaste,
  options,
  placeholder = "Tìm kiếm sản phẩm...",
  className = "",
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const [filteredOptions, setFilteredOptions] = useState<ProductOption[]>(options);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter options based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredOptions(options);
    } else {
      const filtered = options.filter(option =>
        option.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        option.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (option.category && option.category.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredOptions(filtered);
    }
    setHighlightedIndex(-1);
  }, [searchTerm, options]);

  // Update search term when value changes externally
  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onChange(newValue);
    setIsOpen(true);
  };

  // Handle option selection
  const handleOptionSelect = (option: ProductOption) => {
    setSearchTerm(option.name);
    onChange(option.name, option);
    setIsOpen(false);
    
    // Auto-lookup product code
    if (onCodeLookup) {
      onCodeLookup(option.code);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        return;
      }
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleOptionSelect(filteredOptions[highlightedIndex]);
        }
        break;
      
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle input focus
  const handleFocus = () => {
    setIsOpen(true);
  };

  // Handle paste event for bulk input
  const handlePaste = (e: React.ClipboardEvent) => {
    const pastedText = e.clipboardData.getData('text');
    
    // Check if it's bulk paste (multiple lines or comma-separated)
    if (pastedText.includes('\n') || pastedText.includes(',') || pastedText.includes('\t')) {
      e.preventDefault();
      
      // Parse bulk data
      const items = pastedText
        .split(/[\n,\t]/)
        .map(item => item.trim())
        .filter(item => item.length > 0);
      
      if (items.length > 1) {
        // Trigger bulk paste handler with validation modal
        if (onBulkPaste) {
          onBulkPaste(items);
        } else {
          console.log('Bulk paste detected:', items);
          alert(`🔍 Phát hiện dán hàng loạt ${items.length} sản phẩm!\n\nTính năng validation sẽ được triển khai để kiểm tra mapping mã sản phẩm.`);
        }
      }
    }
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onPaste={handlePaste}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
        } ${isOpen ? 'border-blue-300' : 'border-gray-300'}`}
      />

      {/* Dropdown icon */}
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredOptions.length > 0 ? (
            <>
              {/* Search stats */}
              <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50 border-b">
                🔍 Tìm thấy {filteredOptions.length} sản phẩm
                {searchTerm && ` cho "${searchTerm}"`}
              </div>
              
              {/* Options */}
              {filteredOptions.map((option, index) => (
                <div
                  key={option.id}
                  onClick={() => handleOptionSelect(option)}
                  className={`px-3 py-2 cursor-pointer hover:bg-blue-50 ${
                    index === highlightedIndex ? 'bg-blue-100' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{option.name}</div>
                      <div className="text-xs text-gray-500">
                        📦 {option.code}
                        {option.category && ` • ${option.category}`}
                      </div>
                    </div>
                    {index === highlightedIndex && (
                      <div className="text-blue-500">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="px-3 py-4 text-center text-gray-500">
              <div className="text-2xl mb-2">🔍</div>
              <div className="text-sm">
                Không tìm thấy sản phẩm nào
                {searchTerm && (
                  <div className="mt-1">
                    cho từ khóa "<strong>{searchTerm}</strong>"
                  </div>
                )}
              </div>
              <div className="text-xs mt-2 text-gray-400">
                💡 Thử tìm theo tên hoặc mã sản phẩm
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      {isOpen && (
        <div className="absolute z-40 w-full mt-1 p-2 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-700 shadow-sm">
          <div className="flex items-center space-x-4">
            <span>⌨️ <strong>↑↓</strong> điều hướng</span>
            <span>⏎ <strong>Enter</strong> chọn</span>
            <span>⎋ <strong>Esc</strong> đóng</span>
            <span>📋 <strong>Paste</strong> hàng loạt</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableDropdown;
