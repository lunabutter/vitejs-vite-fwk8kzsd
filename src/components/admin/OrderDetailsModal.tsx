import React from 'react';
import { X } from 'lucide-react';
import { Database } from '../../types/supabase';

type Order = Database['public']['Tables']['orders']['Row'];

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order?: Order;
}

export default function OrderDetailsModal({ isOpen, onClose, order }: OrderDetailsModalProps) {
  if (!isOpen || !order) return null;

  const shippingAddress = JSON.parse(order.shipping_address);
  const billingAddress = JSON.parse(order.billing_address);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Order Details
              </h3>
              <button
                type="button"
                className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                onClick={onClose}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mt-6 space-y-6">
              {/* Order Summary */}
              <div>
                <h4 className="text-sm font-medium text-gray-900">Order Summary</h4>
                <div className="mt-2 bg-gray-50 rounded-lg p-4">
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Order ID</dt>
                      <dd className="mt-1 text-sm text-gray-900">#{order.id.slice(0, 8)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Date Placed</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {new Date(order.created_at).toLocaleDateString()}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Total Amount</dt>
                      <dd className="mt-1 text-sm text-gray-900">${Number(order.total_amount).toFixed(2)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Status</dt>
                      <dd className="mt-1 text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          order.status === 'completed' ? 'bg-green-100 text-green-800' :
                          order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Customer Information */}
              <div>
                <h4 className="text-sm font-medium text-gray-900">Customer Information</h4>
                <div className="mt-2 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div>
                    <h5 className="text-xs font-medium text-gray-500">Shipping Address</h5>
                    <div className="mt-1 text-sm text-gray-900">
                      <p>{shippingAddress.firstName} {shippingAddress.lastName}</p>
                      <p>{shippingAddress.address}</p>
                      <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}</p>
                      <p>{shippingAddress.phone}</p>
                    </div>
                  </div>
                  <div>
                    <h5 className="text-xs font-medium text-gray-500">Billing Address</h5>
                    <div className="mt-1 text-sm text-gray-900">
                      <p>{billingAddress.firstName} {billingAddress.lastName}</p>
                      <p>{billingAddress.address}</p>
                      <p>{billingAddress.city}, {billingAddress.state} {billingAddress.postalCode}</p>
                      <p>{billingAddress.phone}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div>
                <h4 className="text-sm font-medium text-gray-900">Payment Information</h4>
                <div className="mt-2 bg-gray-50 rounded-lg p-4">
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Payment Method</dt>
                      <dd className="mt-1 text-sm text-gray-900">Credit Card</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Payment Status</dt>
                      <dd className="mt-1 text-sm">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Paid
                        </span>
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button
              type="button"
              onClick={onClose}
              className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}