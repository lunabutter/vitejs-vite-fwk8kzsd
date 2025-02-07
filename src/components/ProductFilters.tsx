import React from 'react';
import { Filter, X } from 'lucide-react';

interface ProductFiltersProps {
  filters: {
    make: string;
    model: string;
    year: string;
    category: string;
  };
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductFilters({ filters, onFilterChange, onClearFilters, isOpen, onClose }: ProductFiltersProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <Filter className="h-5 w-5 text-gray-400" />
                <h3 className="ml-2 text-lg font-medium text-gray-900">Filters</h3>
              </div>
              <button
                type="button"
                className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                onClick={onClose}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mt-6 space-y-6">
              <div>
                <label htmlFor="make" className="block text-sm font-medium text-gray-700">
                  Make
                </label>
                <select
                  id="make"
                  value={filters.make}
                  onChange={(e) => onFilterChange('make', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">All Makes</option>
                  <option value="Toyota">Toyota</option>
                  <option value="Honda">Honda</option>
                  <option value="Ford">Ford</option>
                  <option value="Chevrolet">Chevrolet</option>
                  <option value="BMW">BMW</option>
                  <option value="Mercedes">Mercedes</option>
                </select>
              </div>

              <div>
                <label htmlFor="model" className="block text-sm font-medium text-gray-700">
                  Model
                </label>
                <select
                  id="model"
                  value={filters.model}
                  onChange={(e) => onFilterChange('model', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">All Models</option>
                  {filters.make === 'Toyota' && (
                    <>
                      <option value="Camry">Camry</option>
                      <option value="Corolla">Corolla</option>
                      <option value="RAV4">RAV4</option>
                    </>
                  )}
                  {filters.make === 'Honda' && (
                    <>
                      <option value="Civic">Civic</option>
                      <option value="Accord">Accord</option>
                      <option value="CR-V">CR-V</option>
                    </>
                  )}
                  {filters.make === 'Ford' && (
                    <>
                      <option value="F-150">F-150</option>
                      <option value="Mustang">Mustang</option>
                      <option value="Explorer">Explorer</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-700">
                  Year
                </label>
                <select
                  id="year"
                  value={filters.year}
                  onChange={(e) => onFilterChange('year', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">All Years</option>
                  {Array.from({ length: 20 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <select
                  id="category"
                  value={filters.category}
                  onChange={(e) => onFilterChange('category', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  <option value="engine">Engine Parts</option>
                  <option value="transmission">Transmission</option>
                  <option value="brakes">Brakes</option>
                  <option value="suspension">Suspension</option>
                  <option value="electrical">Electrical</option>
                  <option value="body">Body Parts</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Apply Filters
            </button>
            <button
              type="button"
              onClick={() => {
                onClearFilters();
                onClose();
              }}
              className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}