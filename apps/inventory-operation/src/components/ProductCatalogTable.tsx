import React, { useState, useEffect, useMemo } from 'react';
import { Product, ProductCategory, ProductStatus } from '../types';
import ConversionDisplay from './ConversionDisplay';
import ProductHistory from './ProductHistory';
import columnConfigService, { ColumnConfig } from '../services/columnConfigService';
import { getFinishedProductsForCode } from '../data/trialMockData';
import appSettingsService from '../services/appSettingsService';

interface ProductCatalogTableProps {
  products: Product[];
  onEdit?: (product: Product) => void;
  onDelete?: (id: string) => void;
  onSearch?: (query: string) => void;
  isLoading?: boolean;
}

const ProductCatalogTable: React.FC<ProductCatalogTableProps> = ({
  products,
  onEdit,
  onDelete,
  onSearch,
  isLoading = false,
}) => {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'INGREDIENT' | 'FINISHED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showConversionFor, setShowConversionFor] = useState<string | null>(null);
  const [showHistoryFor, setShowHistoryFor] = useState<string | null>(null);
  const [columnConfig, setColumnConfig] = useState<ColumnConfig[]>([]);
  const [showColumnConfig, setShowColumnConfig] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const businessModel = appSettingsService.getBusinessModel();

  const toggleExpandRow = (productId: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  useEffect(() => {
    let initialConfig = columnConfigService.getColumnConfig();
    
    // Auto-filter based on business model if not explicitly configured
    if (businessModel === 'commercial') {
      const hiddenInCommercial = ['inputUnit', 'inputQuantity'];
      initialConfig = initialConfig.map(col => ({
        ...col,
        enabled: hiddenInCommercial.includes(col.key) ? false : col.enabled
      }));
    }
    
    setColumnConfig(initialConfig);
  }, [businessModel]);

  const handleToggleColumn = (key: string) => {
    const updated = columnConfigService.toggleColumn(
      key,
      !columnConfig.find(c => c.key === key)?.enabled
    );
    setColumnConfig(updated);
  };

  const handleApplyPreset = (presetKey: string) => {
    const updated = columnConfigService.applyPreset(presetKey);
    setColumnConfig(updated);
    setShowColumnConfig(false);
  };

  const enabledColumns = columnConfig
    .filter(col => {
      if (!col.enabled) return false;
      // Force hide conversion columns in commercial mode
      if (businessModel === 'commercial' && ['inputUnit', 'inputQuantity'].includes(col.key)) {
        return false;
      }
      return true;
    })
    .sort((a, b) => a.order - b.order);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (onSearch) {
      onSearch(query);
    }
  };

  const getCategoryDisplayName = (category: ProductCategory) => {
    const categoryNames = {
      [ProductCategory.FRUIT]: 'Trái cây',
      [ProductCategory.DRY_GOODS]: 'Đồ khô',
      [ProductCategory.PROCESSED]: 'Sơ chế',
      [ProductCategory.FINISHED]: 'Thành phẩm',
      [ProductCategory.BEVERAGE]: 'Đồ uống',
      [ProductCategory.TOBACCO]: 'Thuốc lá',
      [ProductCategory.OTHER]: 'Khác',
    };
    return categoryNames[category] || category;
  };

  const getProductTypeDisplayName = (isFinishedProduct: boolean) => {
    if (businessModel === 'commercial') return 'Thành phẩm';
    return isFinishedProduct ? 'Thành phẩm' : 'Nguyên liệu/Sơ chế';
  };

  const getProductTypeBadgeClass = (isFinishedProduct: boolean) => {
    if (businessModel === 'commercial') return 'bg-blue-100 text-blue-800';
    return isFinishedProduct
      ? 'bg-blue-100 text-blue-800'
      : 'bg-emerald-100 text-emerald-800';
  };

  const getStatusDisplayName = (status: ProductStatus) => {
    const statusNames = {
      [ProductStatus.ACTIVE]: 'Đang bán',
      [ProductStatus.INACTIVE]: 'Ngừng bán',
    };
    return statusNames[status] || status;
  };

  const getStatusBadgeClass = (status: ProductStatus) => {
    return status === ProductStatus.ACTIVE
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = product.name.toLowerCase().includes(q) || 
                           product.businessCode.toLowerCase().includes(q);
      const matchesFilter = activeFilter === 'ALL' || 
                           (activeFilter === 'FINISHED' && product.isFinishedProduct) ||
                           (activeFilter === 'INGREDIENT' && !product.isFinishedProduct);
      return matchesSearch && matchesFilter;
    });
  }, [products, searchQuery, activeFilter]);

  if (isLoading) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 transition-colors">
      {/* Header with search and Filter */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Danh mục hàng hóa ({filteredProducts.length})
            </h3>
            {businessModel !== 'commercial' && (
            <div className="flex items-center gap-1 mt-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
              <button 
                onClick={() => setActiveFilter('ALL')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeFilter === 'ALL' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
              >
                Tất cả
              </button>
              <button 
                onClick={() => setActiveFilter('INGREDIENT')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeFilter === 'INGREDIENT' ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
              >
                Nguyên liệu
              </button>
              <button 
                onClick={() => setActiveFilter('FINISHED')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeFilter === 'FINISHED' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
              >
                Thành phẩm
              </button>
            </div>
            )}
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <input
                type="text"
                placeholder="Tìm tên hoặc mã SP..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full md:w-64 text-sm outline-none"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400">🔍</span>
              </div>
            </div>
            <button
              onClick={() => setShowColumnConfig(!showColumnConfig)}
              className={`p-2.5 rounded-xl border transition-all ${showColumnConfig ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
              title="Cấu hình cột"
            >
              ⚙️
            </button>
          </div>
        </div>
      </div>

      {/* Column Config Panel */}
      {showColumnConfig && (
        <div className="px-6 py-5 bg-gray-50/50 dark:bg-gray-800/30 border-b border-gray-200 dark:border-gray-800 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Sơ đồ hiển thị (Presets)</h4>
              <div className="flex flex-wrap gap-2">
                {['fnb', 'retail', 'manufacturing', 'default'].map(preset => (
                  <button
                    key={preset}
                    onClick={() => handleApplyPreset(preset)}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all uppercase"
                  >
                    {preset === 'fnb' ? '☕ F&B' : preset === 'retail' ? '🛍️ Retail' : preset === 'manufacturing' ? '🏭 Nhà máy' : '📋 Mặc định'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Tùy chỉnh cột</h4>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {columnConfig.map(col => (
                  <label key={col.key} className="flex items-center gap-2 text-sm cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={col.enabled}
                      onChange={() => handleToggleColumn(col.key)}
                      disabled={col.required}
                      className="w-4 h-4 rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-800"
                    />
                    <span className={`text-xs font-medium ${col.required ? 'text-gray-400 dark:text-gray-600' : 'text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'}`}>
                      {col.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-900">
          <div className="text-gray-200 dark:text-gray-800 text-7xl mb-4">📦</div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
            {searchQuery ? 'Không tìm thấy kết quả' : 'Danh mục trống'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {searchQuery
              ? `Không có sản phẩm nào khớp với từ khóa "${searchQuery}"`
              : 'Bắt đầu bằng cách thêm sản phẩm mới vào hệ thống'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto relative">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-800/50 sticky top-0 z-10">
              <tr>
                {enabledColumns.map(col => (
                  <th
                    key={col.key}
                    className={`px-6 py-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider ${
                      col.key === 'actions' ? 'text-right' : 'text-left'
                    } ${
                      col.key === 'product' ? 'sticky left-0 bg-gray-50 dark:bg-gray-800 z-20' : ''
                    } ${
                      col.key === 'actions' ? 'sticky right-0 bg-gray-50 dark:bg-gray-800 z-20' : ''
                    }`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800/50">
              {filteredProducts.map((product) => {
                const relatedFinished = !product.isFinishedProduct ? getFinishedProductsForCode(product.businessCode, products) : [];
                const isExpanded = expandedRows.has(product.id);
                return (
                <React.Fragment key={product.id}>
                <tr className="group hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors">
                  {enabledColumns.map(col => (
                    <td
                      key={col.key}
                      className={`px-6 py-4 whitespace-nowrap ${
                        col.key === 'actions' ? 'text-right' : ''
                      } ${
                        col.key === 'product' ? 'sticky left-0 bg-white dark:bg-gray-900 group-hover:bg-blue-50/30 dark:group-hover:bg-blue-900/10 z-10' : ''
                      } ${
                        col.key === 'actions' ? 'sticky right-0 bg-white dark:bg-gray-900 group-hover:bg-blue-50/30 dark:group-hover:bg-blue-900/10 z-10' : ''
                      }`}
                    >
                      {col.key === 'product' && (
                        <div className="flex items-center gap-3">
                          {relatedFinished.length > 0 ? (
                            <button
                              onClick={() => toggleExpandRow(product.id)}
                              className={`w-6 h-6 flex items-center justify-center rounded-lg text-[10px] transition-all flex-shrink-0 shadow-sm ${
                                isExpanded ? 'bg-blue-600 text-white rotate-90' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800'
                              }`}
                            >
                              ▶
                            </button>
                          ) : (
                            <div className="w-6 flex-shrink-0" />
                          )}
                          <div>
                            <div className="text-sm font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                              {product.name}
                            </div>
                            <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tight">
                              {getCategoryDisplayName(product.category)}
                              {relatedFinished.length > 0 && (
                                <span className="ml-2 text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">Used in {relatedFinished.length} TP</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      {col.key === 'productType' && (
                        <span className={`inline-flex px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg shadow-sm border ${getProductTypeBadgeClass(product.isFinishedProduct)}`}>
                          {getProductTypeDisplayName(product.isFinishedProduct)}
                        </span>
                      )}
                      {col.key === 'productCode' && (
                        <div className="text-xs">
                          <div className="font-bold text-gray-700 dark:text-gray-300">{product.businessCode}</div>
                          {product.promotionCode && (
                            <div className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">KM: {product.promotionCode}</div>
                          )}
                        </div>
                      )}
                      {col.key === 'inputUnit' && (
                        <div className="text-sm font-bold text-gray-700 dark:text-gray-300">
                          {!product.isFinishedProduct ? (product.inputUnit || '-') : <span className="text-gray-300 dark:text-gray-700 text-xs italic">N/A</span>}
                        </div>
                      )}
                      {col.key === 'inputQuantity' && (
                        !product.isFinishedProduct ? (
                          <div className="flex flex-col gap-2">
                            {product.conversions && product.conversions.filter(c => !c.targetProductCode).length > 0 ? (
                              product.conversions.filter(c => !c.targetProductCode).map((conv, idx) => (
                                <div key={idx} className="bg-emerald-50/50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl p-2 w-fit min-w-[100px]">
                                  <div className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                                    {conv.description ? conv.description.split(' = ')[1] : `${conv.conversionRate} ${conv.toUnit}`}
                                  </div>
                                  <div className="text-[10px] font-bold text-emerald-400 dark:text-emerald-600 uppercase">
                                    {conv.description ? `cho ${conv.description.split(' = ')[0]}` : `cho mỗi 1 ${conv.fromUnit}`}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="bg-emerald-50/50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl p-2 w-fit min-w-[100px]">
                                <div className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                                  {product.outputQuantity} {product.outputUnit || product.intermediateUnits?.[0] || ''}
                                </div>
                                <div className="text-[10px] font-bold text-emerald-400 dark:text-emerald-600 uppercase">
                                  cho mỗi {product.inputUnit}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-300 dark:text-gray-700 text-xs italic">N/A</span>
                        )
                      )}
                      {col.key === 'outputUnit' && (
                        <div className="text-sm font-bold text-blue-700 dark:text-blue-400">
                          {product.isFinishedProduct ? (product.outputUnit || '-') : <span className="text-gray-300 dark:text-gray-700 text-xs italic font-normal">N/A</span>}
                        </div>
                      )}
                      {col.key === 'status' && (
                        <span className={`inline-flex px-2 py-1 text-[10px] font-bold uppercase rounded-lg border ${getStatusBadgeClass(product.status)}`}>
                          {getStatusDisplayName(product.status)}
                        </span>
                      )}
                      {col.key === 'actions' && (
                        <div className="flex justify-end items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setShowConversionFor(product.id)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Xem quy đổi"
                          >
                            🔄
                          </button>
                          <button
                            onClick={() => setShowHistoryFor(product.id)}
                            className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                            title="Lịch sử"
                          >
                            📝
                          </button>
                          {onEdit && (
                            <button
                              onClick={() => onEdit(product)}
                              className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-bold transition-all"
                            >
                              Sửa
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={() => onDelete(product.id)}
                              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
                {/* Expandable row */}
                {isExpanded && relatedFinished.length > 0 && (
                  <tr>
                    <td colSpan={enabledColumns.length} className="px-6 py-4 bg-gray-50/50 dark:bg-gray-800/30 border-l-4 border-l-blue-500">
                      <div className="pl-6">
                        <div className="text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-pulse"></span>
                          Đang được sử dụng trong {relatedFinished.length} thành phẩm:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {relatedFinished.map(fp => (
                            <div key={fp.id} className="inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm group/item hover:border-blue-300 dark:hover:border-blue-800 transition-all">
                              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">{fp.businessCode}</span>
                              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{fp.name}</span>
                              <span className="text-[10px] font-bold text-gray-300 dark:text-gray-600 uppercase group-hover/item:text-blue-400 dark:group-hover/item:text-blue-500 transition-colors">Recipe link</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Conversion Display Modal */}
      {showConversionFor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 transition-all">
          <div className="relative top-20 mx-auto p-5 border dark:border-gray-800 w-11/12 max-w-4xl shadow-2xl rounded-2xl bg-white dark:bg-gray-900">
            <div className="mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    Thông tin quy đổi
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {filteredProducts.find((p) => p.id === showConversionFor)?.name}
                  </p>
                </div>
                <button
                  onClick={() => setShowConversionFor(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>
            </div>

            {showConversionFor && (
              <ConversionDisplay
                product={filteredProducts.find((p) => p.id === showConversionFor)!}
              />
            )}

            <div className="flex justify-end mt-6 pt-4 border-t dark:border-gray-800">
              <button
                onClick={() => setShowConversionFor(null)}
                className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Display Modal */}
      {showHistoryFor && (
        <ProductHistory
          product={filteredProducts.find((p) => p.id === showHistoryFor)!}
          onClose={() => setShowHistoryFor(null)}
        />
      )}
    </div>
  );
};

export default ProductCatalogTable;
