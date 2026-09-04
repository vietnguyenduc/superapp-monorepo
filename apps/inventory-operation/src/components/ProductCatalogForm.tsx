import React, { useState, useEffect } from 'react';
import { ProductCategory, ProductStatus, Product } from '../types';
import appSettingsService from '../services/appSettingsService';
import { useProducts } from '../hooks/useProducts';

interface ProductCatalogFormProps {
  onSubmit: (data: Partial<Product>) => void;
  onCancel: () => void;
  initialData?: Partial<Product>;
  isLoading?: boolean;
}

const ProductCatalogForm: React.FC<ProductCatalogFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
}) => {
  const { products, fetchProducts } = useProducts();
  const finishedProducts = products.filter(p => p.isFinishedProduct);

  const conversionMode = appSettingsService.getIntermediateConversionMode();
  const businessModel = appSettingsService.getBusinessModel();
  const unitOptions = appSettingsService.getUnits();
  
  const initialFormState = {
    category: ProductCategory.FRUIT,
    businessCode: '',
    promotionCode: '',
    name: '',
    isFinishedProduct: false,
    outputQuantity: 1,
    inputQuantity: 1,
    finishedProductCode: '',
    inputUnit: '',
    outputUnit: '',
    standardInputPrice: 0,
    status: ProductStatus.ACTIVE,
    businessStatus: 'active',
    intermediateUnits: [],
    conversions: [],
    linkedFinishedProductCodes: [],
    ...initialData,
  };

  const [formData, setFormData] = useState<Partial<Product>>(initialFormState);

  const [searchTerm, setSearchTerm] = useState('');
  const [globalFromQty, setGlobalFromQty] = useState('1');
  const [globalToQty, setGlobalToQty] = useState('1');
  const [specificFromQty, setSpecificFromQty] = useState('1');
  const [specificToQty, setSpecificToQty] = useState('1');
  const [newGlobalConv, setNewGlobalConv] = useState({ fromUnit: '', toUnit: '' });
  const [newSpecificConv, setNewSpecificConv] = useState({ fromUnit: '', toUnit: '' });
  const [activeLinkedCode, setActiveLinkedCode] = useState<string | null>(null);

  const isFocusedProductLinked = formData.linkedFinishedProductCodes?.includes(activeLinkedCode || '');

  // QA Agent: Kiểm tra xem các thành phẩm đã liên kết có định mức quy đổi chưa
  const getMissingConversions = (data: Partial<Product>) => {
    if (data.isFinishedProduct || !data.linkedFinishedProductCodes?.length) return [];
    
    const missing: string[] = [];
    data.linkedFinishedProductCodes.forEach(code => {
      const targetProduct = finishedProducts.find(p => p.businessCode === code);
      if (!targetProduct) return;
      
      const hasConversion = data.conversions?.some(c => 
        c.targetProductCode === code || c.toUnit === targetProduct.outputUnit
      );
      
      if (!hasConversion) missing.push(code);
    });
    return missing;
  };

  const missingConversions = getMissingConversions(formData);
  
  // Sync: Auto-purge conversions when units are removed or changed
  useEffect(() => {
    const validUnits = new Set([
      formData.inputUnit,
      formData.outputUnit,
      ...(formData.intermediateUnits || []),
      // Also include output units of all finished products for recipe targets
      ...products.filter(p => p.isFinishedProduct).map(p => p.outputUnit)
    ].filter(Boolean));

    const filteredConversions = (formData.conversions || []).filter(c => 
      validUnits.has(c.fromUnit) && validUnits.has(c.toUnit)
    );

    if (filteredConversions.length !== (formData.conversions || []).length) {
      setFormData(prev => ({ ...prev, conversions: filteredConversions }));
    }
  }, [formData.intermediateUnits, formData.inputUnit, formData.outputUnit]);

  // Force isFinishedProduct=true in commercial mode (no raw materials allowed)
  useEffect(() => {
    if (businessModel === 'commercial' && !formData.isFinishedProduct) {
      setFormData(prev => ({ ...prev, isFinishedProduct: true }));
    }
  }, [businessModel]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for unit conflicts (Finished products can have same input/output unit)
    const allUnits = [
      formData.inputUnit,
      ...(!formData.isFinishedProduct ? (formData.intermediateUnits || []) : [])
    ].filter(Boolean);
    
    const hasDuplicateUnits = allUnits.some((u, i) => allUnits.indexOf(u) !== i);
    if (hasDuplicateUnits) {
      alert('Vui lòng kiểm tra lại các đơn vị tính. Mỗi đơn vị (Nhập, Trung gian) phải là duy nhất.');
      return;
    }
    
    if (!formData.isFinishedProduct && missingConversions.length > 0) {
      const firstMissing = finishedProducts.find(p => p.businessCode === missingConversions[0]);
      alert(`Thiếu quy đổi cho thành phẩm "${firstMissing?.name}". Vui lòng thiết lập quy đổi tại phần "Cấu hình Quy đổi".`);
      return;
    }
    
    // Call onSubmit
    await onSubmit(formData);

    // Reset if it was a new product
    if (!initialData) {
      setFormData(initialFormState);
      setSearchTerm('');
      setActiveLinkedCode(null);
      fetchProducts();
    }
  };

  const handleInputChange = (field: keyof Product, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      if (field === 'isFinishedProduct') {
        if (value === true) {
          newData.category = ProductCategory.FINISHED;
          newData.linkedFinishedProductCodes = [];
          newData.intermediateUnits = [];
          newData.conversions = [];
          if (prev.inputUnit && !prev.outputUnit) {
            newData.outputUnit = prev.inputUnit;
          }
        } else {
          if (prev.category === ProductCategory.FINISHED) {
            newData.category = ProductCategory.FRUIT;
          }
        }
      }
      
      return newData;
    });
  };

  const addIntermediateUnit = () => handleInputChange('intermediateUnits', [...(formData.intermediateUnits || []), '']);
  const addConversion = (from: string, to: string, rate: number) => handleAddConversion({ fromUnit: from, toUnit: to, conversionRate: rate });

  const handleAddConversion = (conversion: any) => {
    setFormData(prev => {
      const newConversions = [...(prev.conversions || []), { 
        ...conversion, 
        productId: prev.id || prev.businessCode || 'new-product' 
      }];
      return { ...prev, conversions: newConversions };
    });
  };

  const handleRemoveConversion = (index: number) => {
    setFormData(prev => {
      const newConversions = prev.conversions?.filter((_: any, i: number) => i !== index) || [];
      return { ...prev, conversions: newConversions };
    });
  };

  const handleLinkToggle = (code: string, isChecked: boolean, outputUnit: string) => {
    setFormData(prev => {
      const codes = isChecked 
        ? [...(prev.linkedFinishedProductCodes || []), code]
        : (prev.linkedFinishedProductCodes || []).filter(c => c !== code);
      
      const conversions = isChecked 
        ? prev.conversions 
        : (prev.conversions || []).filter(c => c.targetProductCode !== code);
        
      return { ...prev, linkedFinishedProductCodes: codes, conversions };
    });

    if (isChecked) {
      setActiveLinkedCode(code);
      // Auto-suggest logic
      const hasConversion = formData.conversions?.some(c => c.targetProductCode === code);
      if (!hasConversion) {
        setNewSpecificConv({
          fromUnit: formData.intermediateUnits?.[0] || formData.inputUnit || '',
          toUnit: outputUnit
        });
        setSpecificFromQty('1');
        setSpecificToQty('1');
        document.getElementById('conversion-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else if (activeLinkedCode === code) {
      setActiveLinkedCode(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
        <h2 className="text-xl font-bold">
          {initialData ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
        </h2>
        <p className="text-blue-100 text-sm mt-1">Quản lý danh mục, đơn vị tính và định mức quy đổi</p>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Section 1: Thông tin cơ bản */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2 pb-2 border-b border-gray-100">
              <span className="text-blue-600">📝</span>
              <h3 className="font-bold text-gray-800">Thông tin cơ bản</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tên sản phẩm *</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="VD: Xoài cát Hòa Lộc..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Mã sản phẩm *</label>
                  <input
                    type="text"
                    value={formData.businessCode || ''}
                    onChange={(e) => handleInputChange('businessCode', e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="VD: NVL-XO01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Danh mục</label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value as ProductCategory)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    disabled={formData.isFinishedProduct}
                  >
                    <option value={ProductCategory.FRUIT}>Trái cây tươi</option>
                    <option value={ProductCategory.PROCESSED}>Hàng sơ chế</option>
                    <option value={ProductCategory.DRY_GOODS}>Hàng khô/Gia vị</option>
                    <option value={ProductCategory.BEVERAGE}>Đồ uống</option>
                    <option value={ProductCategory.FINISHED}>Thành phẩm</option>
                    <option value={ProductCategory.OTHER}>Khác</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Giá nhập tiêu chuẩn (VNĐ)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.standardInputPrice || ''}
                  onChange={(e) => handleInputChange('standardInputPrice', Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="VD: 50000"
                />
                <p className="text-[10px] text-gray-400 mt-1 italic">Dùng để kiểm soát biến động giá nhập kho của kế toán.</p>
              </div>

              {businessModel !== 'commercial' && (
              <div className="flex items-center p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <input
                  type="checkbox"
                  id="isFinishedProduct"
                  checked={formData.isFinishedProduct || false}
                  onChange={(e) => handleInputChange('isFinishedProduct', e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isFinishedProduct" className="ml-3 font-bold text-blue-900">
                  Đây là Thành phẩm (Dùng để bán)
                </label>
              </div>
              )}
            </div>
          </div>

          {/* Section 2: Đơn vị tính */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2 pb-2 border-b border-gray-100">
              <span className="text-blue-600">⚖️</span>
              <h3 className="font-bold text-gray-800">Định nghĩa Đơn vị tính</h3>
            </div>

            <div className="grid grid-cols-1 gap-5">
              {!formData.isFinishedProduct && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">ĐVT Nhập *</label>
                  <select
                    value={formData.inputUnit || ''}
                    onChange={(e) => handleInputChange('inputUnit', e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    required
                  >
                    <option value="">Chọn đơn vị...</option>
                    {unitOptions.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              )}

              {businessModel !== 'commercial' && !formData.isFinishedProduct && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-bold text-gray-600 uppercase">ĐVT Trung gian (Sơ chế)</label>
                    {conversionMode === 'multiple' && (
                      <button
                        type="button"
                        onClick={addIntermediateUnit}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <span>+ Thêm</span>
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    {(formData.intermediateUnits || []).map((unit, index) => {
                      const isDuplicate = unit !== '' && (formData.intermediateUnits || []).some((u, i) => u === unit && i !== index);
                      const isOverlap = unit !== '' && (
                        unit === (formData.inputUnit || '') || 
                        (formData.isFinishedProduct && unit === (formData.outputUnit || ''))
                      );
                      const hasError = unit && (isDuplicate || isOverlap);
                      
                      return (
                        <div key={index} className="flex flex-col gap-1">
                          <div className="flex gap-2">
                            <select
                              value={unit}
                              onChange={(e) => {
                                const newUnits = [...(formData.intermediateUnits || [])];
                                newUnits[index] = e.target.value;
                                handleInputChange('intermediateUnits', newUnits);
                              }}
                              className={`flex-1 px-3 py-2 bg-white border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                                hasError ? 'border-red-400 ring-1 ring-red-100' : 'border-gray-200'
                              }`}
                            >
                              <option value="">Chọn đơn vị...</option>
                              {unitOptions.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                            {conversionMode === 'multiple' && (
                              <button
                                type="button"
                                onClick={() => handleInputChange('intermediateUnits', (formData.intermediateUnits || []).filter((_, i) => i !== index))}
                                className="p-2 text-gray-400 hover:text-red-500"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                          {hasError && (
                            <p className="text-[9px] text-red-500 font-bold ml-1">
                              {isDuplicate ? '⚠️ Đơn vị này đã tồn tại' : '⚠️ Trùng với ĐVT Nhập/Xuất'}
                            </p>
                          )}
                        </div>
                      );
                    })}
                    
                    {((formData.intermediateUnits || []).length === 0) && (
                      <div className="flex flex-col gap-1">
                        <div className="flex gap-2">
                          <select
                            onChange={(e) => handleInputChange('intermediateUnits', [e.target.value])}
                            className="flex-1 px-3 py-2 bg-white border border-gray-200 border-dashed rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all italic text-gray-400"
                          >
                            <option value="">+ Thêm đơn vị sơ chế...</option>
                            {unitOptions.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {formData.isFinishedProduct && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Đơn vị tính (Bán ra) *</label>
                  <select
                    value={formData.outputUnit || ''}
                    onChange={(e) => handleInputChange('outputUnit', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    required
                  >
                    <option value="">Chọn đơn vị...</option>
                    {unitOptions.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Quy đổi & Liên kết */}
        {businessModel !== 'commercial' && !formData.isFinishedProduct && (
          <div id="conversion-section" className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8 border-t border-gray-100">
            {/* Cấu hình Quy đổi & Định mức */}
            <div className="space-y-10">
              {/* 1. Quy đổi Trung gian (Cố định) */}
              {formData.intermediateUnits && formData.intermediateUnits.length > 0 && (
                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                  <div className="flex flex-col space-y-1 pb-2 border-b border-gray-100">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">⚙️</span>
                      <h3 className="font-bold text-gray-800">Quy đổi Trung gian (Cố định)</h3>
                    </div>
                    <p className="text-[10px] text-gray-500 ml-8 italic">* Quy tắc sơ chế (VD: 1 {formData.inputUnit || 'Đơn vị nhập'} = 10 Miếng)</p>
                  </div>
                  
                  <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Đơn vị gốc (Nhập)</label>
                        <div className="flex gap-2">
                          <input type="number" step="0.01" value={globalFromQty} onChange={e => setGlobalFromQty(e.target.value)} className="w-20 px-2 py-2 text-sm border border-gray-200 rounded-lg outline-none font-bold text-gray-700 bg-white" placeholder="Số"/>
                          <div className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-100 text-gray-500 font-bold flex items-center">
                            {formData.inputUnit || 'ĐVT Nhập'}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Quy đổi sang trung gian</label>
                        <div className="flex gap-2">
                          <input type="number" step="0.01" value={globalToQty} onChange={e => setGlobalToQty(e.target.value)} className="w-20 px-2 py-2 text-sm border border-gray-200 rounded-lg outline-none font-bold text-blue-600 bg-white" placeholder="Số"/>
                          {conversionMode === 'multiple' ? (
                            <select value={newGlobalConv.toUnit} onChange={e => setNewGlobalConv(p => ({ ...p, toUnit: e.target.value }))} className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none bg-white font-bold text-gray-700">
                              <option value="">Chọn ĐVT TG...</option>
                              {(formData.intermediateUnits || []).map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                          ) : (
                            <div className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-blue-50 text-blue-700 font-bold flex items-center">
                              {formData.intermediateUnits?.[0] || 'Chưa chọn ĐVT'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {(conversionMode === 'multiple' || (formData.conversions || []).filter(c => !c.targetProductCode).length === 0) && (
                      <button 
                        type="button" 
                        onClick={() => {
                          const fQty = parseFloat(globalFromQty);
                          const tQty = parseFloat(globalToQty);
                          const toUnit = conversionMode === 'single' ? formData.intermediateUnits?.[0] : newGlobalConv.toUnit;
                          
                          if (formData.inputUnit && toUnit && fQty > 0 && tQty > 0) {
                            handleAddConversion({
                              fromUnit: formData.inputUnit, 
                              toUnit: toUnit, 
                              conversionRate: tQty / fQty,
                              description: `${fQty} ${formData.inputUnit} = ${tQty} ${toUnit}`
                            });
                            setNewGlobalConv(p => ({ ...p, toUnit: '' })); 
                            setGlobalFromQty('1'); 
                            setGlobalToQty('1');
                          }
                        }} 
                        className="w-full py-2.5 bg-gray-800 text-white rounded-xl text-xs font-bold hover:bg-black transition-all shadow-sm"
                      >
                        {conversionMode === 'single' ? 'Thiết lập quy đổi chuẩn' : 'Thêm Quy đổi trung gian'}
                      </button>
                    )}

                    <div className="space-y-2 max-h-[150px] overflow-y-auto">
                      {(formData.conversions || []).filter(c => !c.targetProductCode).map((c, i) => (
                        <div key={i} className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-100 shadow-sm group animate-in fade-in slide-in-from-right-2">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                            <div className="text-xs font-bold text-gray-700">{c.description || `${1/c.conversionRate} ${c.fromUnit} = 1 ${c.toUnit}`}</div>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveConversion((formData.conversions || []).indexOf(c))} 
                            className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Định mức Thành phẩm (Riêng) */}
              <div className="space-y-6">
                <div className="flex flex-col space-y-1 pb-2 border-b border-gray-100">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">🥗</span>
                    <h3 className="font-bold text-gray-800">
                      {activeLinkedCode && isFocusedProductLinked
                        ? `Định mức: ${products.find(p => p.businessCode === activeLinkedCode)?.name}`
                        : 'Định mức Thành phẩm'}
                    </h3>
                  </div>
                  {activeLinkedCode && isFocusedProductLinked && <p className="text-[10px] text-blue-600 font-medium ml-8 italic">* Quy tắc riêng cho món này (VD: 1 Dĩa = 20 Miếng)</p>}
                </div>

                {activeLinkedCode && isFocusedProductLinked ? (
                  <div className="bg-blue-50/30 p-5 rounded-2xl border border-blue-100 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-2 gap-3">
                      {/* Left Side */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Vế trái</label>
                        <div className="flex gap-2">
                          <input type="number" step="0.01" value={specificFromQty} onChange={e => setSpecificFromQty(e.target.value)} className="w-20 px-2 py-2 text-sm border border-gray-200 rounded-lg outline-none font-bold text-gray-700 bg-white" placeholder="Số"/>
                          <select 
                            value={newSpecificConv.fromUnit} 
                            onChange={e => setNewSpecificConv(p => ({ ...p, fromUnit: e.target.value }))} 
                            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none bg-white font-bold text-gray-700"
                          >
                            <option value="">Đơn vị...</option>
                            {[
                              formData.inputUnit, 
                              ...(formData.intermediateUnits || []),
                              products.find(p => p.businessCode === activeLinkedCode)?.outputUnit
                            ].filter(Boolean).map((u, idx) => <option key={`${u}-${idx}`} value={u!}>{u}</option>)}
                          </select>
                        </div>
                      </div>

                      {/* Right Side */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Vế phải</label>
                        <div className="flex gap-2">
                          <input type="number" step="0.01" value={specificToQty} onChange={e => setSpecificToQty(e.target.value)} className="w-20 px-2 py-2 text-sm border border-gray-200 rounded-lg outline-none font-bold text-blue-600 bg-white" placeholder="Số"/>
                          <select 
                            value={newSpecificConv.toUnit} 
                            onChange={e => setNewSpecificConv(p => ({ ...p, toUnit: e.target.value }))} 
                            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none bg-white font-bold text-gray-700"
                          >
                            <option value="">Đơn vị...</option>
                            {[
                              formData.inputUnit, 
                              ...(formData.intermediateUnits || []),
                              products.find(p => p.businessCode === activeLinkedCode)?.outputUnit
                            ].filter(Boolean).map((u, idx) => <option key={`${u}-${idx}`} value={u!}>{u}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>

                    <button type="button" onClick={() => {
                      const fQty = parseFloat(specificFromQty);
                      const tQty = parseFloat(specificToQty);
                      const target = products.find(p => p.businessCode === activeLinkedCode);
                      if (newSpecificConv.fromUnit && newSpecificConv.toUnit && fQty > 0 && tQty > 0) {
                        handleAddConversion({
                          fromUnit: newSpecificConv.fromUnit, 
                          toUnit: newSpecificConv.toUnit, 
                          conversionRate: tQty / fQty,
                          targetProductCode: activeLinkedCode || undefined,
                          description: `${fQty} ${newSpecificConv.fromUnit} = ${tQty} ${newSpecificConv.toUnit} (${target?.name})`
                        });
                        // Don't clear units, just reset quantities for speed
                        setSpecificFromQty('1'); 
                        setSpecificToQty('1');
                      }
                    }} className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-sm">
                      Thêm Định mức món này
                    </button>

                    <div className="space-y-2">
                      {(formData.conversions || []).filter(c => c.targetProductCode === activeLinkedCode).map((c, i) => (
                        <div key={i} className="flex items-center justify-between bg-white p-3 rounded-xl border border-blue-100 shadow-sm group">
                          <div className="text-xs font-bold text-blue-700">{c.description?.split(' (')[0] || `${1/c.conversionRate} ${c.fromUnit} = 1 ${c.toUnit}`}</div>
                          <button type="button" onClick={() => handleRemoveConversion((formData.conversions || []).indexOf(c))} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">✕</button>
                        </div>
                      ))}
                    </div>

                    {/* BOM Section */}
                    <div className="mt-8 pt-6 border-t border-blue-100/50">
                      <div className="text-[10px] font-bold text-gray-400 uppercase mb-4 flex items-center gap-1.5">
                        <span className="text-sm">📝</span> Thành phần cấu thành nên món này
                      </div>
                      <div className="space-y-2">
                        {products
                          .filter(p => p.businessCode !== formData.businessCode && p.conversions?.some(c => c.targetProductCode === activeLinkedCode))
                          .map(p => {
                            const conv = p.conversions?.find(c => c.targetProductCode === activeLinkedCode);
                            return (
                              <div key={p.businessCode} className="flex items-center justify-between bg-white/60 p-2.5 rounded-lg border border-gray-100 border-dashed">
                                <div className="text-xs font-medium text-gray-600">{p.name}</div>
                                <div className="text-xs font-bold text-gray-800">
                                  {conv?.description?.split(' (')[0] || `${1/conv!.conversionRate} ${conv?.fromUnit} = 1 ${conv?.toUnit}`}
                                </div>
                              </div>
                            );
                          })}
                        {products.filter(p => p.businessCode !== formData.businessCode && p.conversions?.some(c => c.targetProductCode === activeLinkedCode)).length === 0 && (
                          <div className="text-[10px] text-gray-400 italic text-center py-4 bg-white/20 rounded-lg border border-dashed border-gray-100">
                            Chưa có nguyên liệu khác liên kết
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50/50 p-10 rounded-3xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 text-2xl">🥗</div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Chọn thành phẩm bên phải để set định mức riêng</h4>
                  </div>
                )}
              </div>
            </div>

            {/* Liên kết Thành phẩm */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 pb-2 border-b border-gray-100">
                <span className="text-blue-600">🔗</span>
                <h3 className="font-bold text-gray-800">
                  Liên kết Thành phẩm ({formData.linkedFinishedProductCodes?.length || 0})
                </h3>
              </div>
              <input type="text" placeholder="Tìm kiếm thành phẩm..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"/>
              <div className="max-h-[400px] overflow-y-auto pr-2 space-y-2">
                {finishedProducts
                  .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.businessCode.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(product => {
                    const isLinked = (formData.linkedFinishedProductCodes || []).includes(product.businessCode);
                    const isActive = activeLinkedCode === product.businessCode;
                    
                    return (
                      <div 
                        key={product.businessCode}
                        className={`flex items-center p-3 rounded-xl border transition-all ${
                          isActive
                            ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-100 shadow-md scale-[1.02]'
                            : isLinked
                              ? 'bg-blue-50/30 border-blue-200 hover:bg-blue-50/50 cursor-pointer'
                              : 'bg-white border-gray-100 hover:bg-gray-50 cursor-pointer'
                        }`}
                        onClick={() => {
                          setActiveLinkedCode(isActive ? null : product.businessCode);
                          if (isLinked) {
                            document.getElementById('conversion-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }
                        }}
                      >
                        <div className="flex items-center justify-center pr-3 mr-3 border-r border-gray-100" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isLinked}
                            onChange={(e) => handleLinkToggle(product.businessCode, e.target.checked, product.outputUnit)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-sm font-bold text-gray-800">{product.name}</div>
                            {isLinked && (
                              missingConversions.includes(product.businessCode) 
                                ? <span className="text-[10px] font-bold text-red-500 animate-pulse">⚠️ Thiếu định lượng</span> 
                                : <span className="text-[10px] font-bold text-green-600">✅ Đã có định lượng</span>
                            )}
                          </div>
                          <div className="text-[10px] text-gray-500 flex justify-between items-center">
                            <span>{product.businessCode} • ĐVT: {product.outputUnit}</span>
                            {isActive && <span className="text-blue-600 font-bold">● Đang xem</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
          <button type="button" onClick={onCancel} className="px-6 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors" disabled={isLoading}>Hủy bỏ</button>
          <button type="submit" className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all" disabled={isLoading}>{isLoading ? 'Đang xử lý...' : (initialData ? 'Cập nhật sản phẩm' : 'Lưu sản phẩm')}</button>
        </div>
      </form>
    </div>
  );
};

export default ProductCatalogForm;
