import React from 'react';
import { Building2, Settings, Image as ImageIcon, Save } from 'lucide-react';

export default function GlobalSettings() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Global Settings</h1>
          <p className="text-gray-500 mt-1">Configure company-wide branding and shared preferences.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100 bg-gray-50/50 p-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-gray-500" />
          <h2 className="font-semibold text-gray-800">Company Identity</h2>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Company Name</label>
              <input 
                type="text" 
                defaultValue="Acme Corporation"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Primary Email</label>
              <input 
                type="email" 
                defaultValue="contact@acme.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Timezone</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                <option>Asia/Ho_Chi_Minh (UTC+07:00)</option>
                <option>UTC (UTC+00:00)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Default Currency</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                <option>VND (₫)</option>
                <option>USD ($)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Logo & Branding</h3>
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center bg-gray-50 text-gray-400 hover:bg-gray-100 cursor-pointer transition-colors">
                <ImageIcon className="w-8 h-8 mb-1" />
                <span className="text-xs">Upload</span>
              </div>
              <div className="flex-1 space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Primary Brand Color</label>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-600 shadow-sm border border-gray-200"></div>
                    <input 
                      type="text" 
                      defaultValue="#4F46E5"
                      className="px-3 py-2 border border-gray-300 rounded-lg w-32 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
