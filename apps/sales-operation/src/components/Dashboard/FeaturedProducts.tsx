import React from 'react';
import { useNavigate } from 'react-router-dom';

interface Product {
  id: string;
  name: string;
  businessCode: string;
  category: string;
  outputQuantity: number;
  outputUnit: string;
  isFinishedProduct: boolean;
}

interface FeaturedProductsProps {
  products: Product[];
  maxItems?: number;
}

const FeaturedProducts: React.FC<FeaturedProductsProps> = ({
  products,
  maxItems = 8,
}) => {
  const navigate = useNavigate();

  // Filter only finished products and sort by output quantity (highest stock)
  const featuredProducts = products
    .filter(p => p.isFinishedProduct)
    .sort((a, b) => b.outputQuantity - a.outputQuantity)
    .slice(0, maxItems);

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Chưa có dữ liệu sản phẩm</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-600">
          Hiển thị {featuredProducts.length}/{products.filter(p => p.isFinishedProduct).length} thành phẩm
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {featuredProducts.map((product, index) => (
          <div
            key={product.id}
            className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100 hover:shadow-md transition-all cursor-pointer"
            onClick={() => navigate(`/product-management?search=${product.name}`)}
          >
            {/* Ranking badge */}
            <div className="flex items-center justify-between mb-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                index === 0 ? 'bg-yellow-400 text-yellow-900' :
                index === 1 ? 'bg-gray-300 text-gray-700' :
                index === 2 ? 'bg-orange-300 text-orange-800' :
                'bg-blue-100 text-blue-600'
              }`}>
                {index + 1}
              </div>
              <div className="text-xs text-gray-500">{product.category}</div>
            </div>

            {/* Product name */}
            <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
              {product.name}
            </h3>

            {/* Product code */}
            <div className="text-xs text-gray-500 mb-3 font-mono">
              {product.businessCode}
            </div>

            {/* Stock quantity */}
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-blue-600">
                {product.outputQuantity}
              </span>
              <span className="text-sm text-gray-600">{product.outputUnit}</span>
            </div>

            {/* Stock label */}
            <div className="text-xs text-blue-500 mt-1 font-medium">
              Tồn thành phẩm
            </div>
          </div>
        ))}
      </div>

      {featuredProducts.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-2">📦</div>
          <p className="text-gray-500">Không có sản phẩm thành phẩm nào</p>
        </div>
      )}
    </div>
  );
};

export default FeaturedProducts;
