import React from 'react';
import { AlertTriangle, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Database } from '../../types/supabase';

type Product = Database['public']['Tables']['products']['Row'];

interface InventoryAlertsProps {
  products: Product[];
  threshold?: number;
}

export default function InventoryAlerts({ products, threshold = 5 }: InventoryAlertsProps) {
  const lowStockProducts = products.filter(product => product.stock <= threshold);

  if (lowStockProducts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center text-green-600">
          <Package className="h-5 w-5 mr-2" />
          <span className="font-medium">All products are well-stocked</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-yellow-400" />
          <h3 className="ml-2 text-sm font-medium text-yellow-800">
            Low Stock Alert ({lowStockProducts.length} products)
          </h3>
        </div>
      </div>
      <div className="divide-y divide-gray-200">
        {lowStockProducts.map((product) => (
          <div key={product.id} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">{product.name}</h4>
                <p className="text-sm text-gray-500">
                  {product.make} {product.model} ({product.year})
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-red-600">
                  Only {product.stock} left
                </p>
                <Link
                  to={`/admin/products/${product.id}`}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Update Stock
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}