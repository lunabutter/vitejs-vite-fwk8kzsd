import React, { useRef, useState } from 'react';
import { Upload, Download, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/supabase';

type Product = Database['public']['Tables']['products']['Row'];

interface BulkProductActionsProps {
  onSuccess: () => void;
}

export default function BulkProductActions({ onSuccess }: BulkProductActionsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Validate and transform data
        const products = jsonData.map((row: any) => ({
          name: row.name,
          description: row.description,
          price: parseFloat(row.price),
          make: row.make,
          model: row.model,
          year: parseInt(row.year),
          condition: row.condition,
          stock: parseInt(row.stock),
          category_id: row.category_id,
          slug: row.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        }));

        // Insert products in batches
        const batchSize = 100;
        for (let i = 0; i < products.length; i += batchSize) {
          const batch = products.slice(i, i + batchSize);
          const { error } = await supabase.from('products').insert(batch);
          if (error) throw error;
        }

        toast.success(`Successfully imported ${products.length} products`);
        onSuccess();
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import products');
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const worksheet = XLSX.utils.json_to_sheet(products);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
      
      // Generate filename with current date
      const date = new Date().toISOString().split('T')[0];
      const filename = `products-export-${date}.xlsx`;
      
      XLSX.writeFile(workbook, filename);
      toast.success('Products exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export products');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Bulk Actions</h3>
      
      <div className="space-y-4">
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="h-5 w-5 mr-2" />
            {importing ? 'Importing...' : 'Import Products'}
          </button>
        </div>

        <button
          onClick={handleExport}
          disabled={exporting}
          className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="h-5 w-5 mr-2" />
          {exporting ? 'Exporting...' : 'Export Products'}
        </button>

        <div className="mt-4 p-4 bg-blue-50 rounded-md">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-blue-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Import Format</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>Required columns:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>name</li>
                  <li>price</li>
                  <li>stock</li>
                  <li>make</li>
                  <li>model</li>
                  <li>year</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}