import React, { useState, useRef, useEffect } from "react";
import { useCompany } from "../../contexts/CompanyContext";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../services/supabase";

const CompanySwitcher: React.FC = () => {
  const { companies, selectedCompany, setSelectedCompany, loading, createCompany, deleteCompany, updateCompany } = useCompany();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyCode, setNewCompanyCode] = useState("");
  const [editCompanyName, setEditCompanyName] = useState("");
  const [editCompanyCode, setEditCompanyCode] = useState("");
  const [editCompanyLogo, setEditCompanyLogo] = useState<File | null>(null);
  const [editCompanyLogoPreview, setEditCompanyLogoPreview] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  // IMPORTANT: All hooks must be called before any conditional returns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Only show for admin_master users
  if (user?.role !== "admin_master") {
    return null;
  }

  if (loading || companies.length === 0) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-sm"
      >
        {/* Building icon */}
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
        <span className="text-sm font-medium max-w-[120px] truncate">
          {selectedCompany?.name || "Select Company"}
        </span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 max-h-80 overflow-y-auto">
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 flex items-center justify-between">
            <span>Switch Company</span>
            <button
              onClick={() => {
                setIsCreateModalOpen(true);
                setIsOpen(false);
              }}
              className="text-indigo-600 hover:text-indigo-700 font-medium text-xs"
            >
              + New Company
            </button>
          </div>
          {companies.map((company) => (
            <button
              key={company.id}
              onClick={() => {
                setSelectedCompany(company);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors flex items-center justify-between group ${
                selectedCompany?.id === company.id ? "bg-indigo-50" : ""
              }`}
            >
              <div className="flex items-center space-x-3 flex-1">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                  {company.name.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{company.name}</div>
                  <div className="text-xs text-gray-500">{company.code}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {selectedCompany?.id === company.id && (
                  <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditCompanyName(company.name);
                    setEditCompanyCode(company.code);
                    setEditCompanyLogo(null);
                    setEditCompanyLogoPreview(company.logo_url || null);
                    setIsEditModalOpen(true);
                    setIsOpen(false);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-blue-500 hover:text-blue-700 transition-opacity cursor-pointer"
                  title="Edit company"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Are you sure you want to delete ${company.name}?`)) {
                      deleteCompany(company.id);
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:text-red-700 transition-opacity cursor-pointer"
                  title="Delete company"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Create Company Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Company</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input
                  type="text"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter company name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Code</label>
                <input
                  type="text"
                  value={newCompanyCode}
                  onChange={(e) => setNewCompanyCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter company code (e.g., ABC)"
                  maxLength={10}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setNewCompanyName("");
                  setNewCompanyCode("");
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newCompanyName && newCompanyCode) {
                    createCompany({ 
                      name: newCompanyName, 
                      code: newCompanyCode,
                      logo_url: null,
                      is_active: true
                    });
                    setIsCreateModalOpen(false);
                    setNewCompanyName("");
                    setNewCompanyCode("");
                  }
                }}
                disabled={!newCompanyName || !newCompanyCode}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Company
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Company Modal */}
      {isEditModalOpen && selectedCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto my-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Edit Company</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Name</label>
                <input
                  type="text"
                  value={editCompanyName}
                  onChange={(e) => setEditCompanyName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter company name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Code</label>
                <input
                  type="text"
                  value={editCompanyCode}
                  onChange={(e) => setEditCompanyCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter company code (e.g., ABC)"
                  maxLength={10}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Logo</label>
                <div className="flex items-center gap-4">
                  {editCompanyLogoPreview ? (
                    <img
                      src={editCompanyLogoPreview}
                      alt="Company Logo"
                      className="w-16 h-16 rounded-lg object-cover border border-gray-300 dark:border-gray-600"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">No Logo</span>
                    </div>
                  )}
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setEditCompanyLogo(file);
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setEditCompanyLogoPreview(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                    <span className="px-3 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium">
                      Upload Logo
                    </span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditCompanyName("");
                  setEditCompanyCode("");
                  setEditCompanyLogo(null);
                  setEditCompanyLogoPreview(null);
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!editCompanyName || !editCompanyCode) return;

                  let logoUrl = selectedCompany?.logo_url || null;

                  // Upload logo if a new file was selected
                  if (editCompanyLogo) {
                    try {
                      const fileName = `${Date.now()}-${editCompanyLogo.name}`;
                      const { error: uploadError } = await supabase.storage
                        .from('company-logos')
                        .upload(fileName, editCompanyLogo);

                      if (uploadError) throw uploadError;

                      // Get public URL
                      const { data: publicUrlData } = supabase.storage
                        .from('company-logos')
                        .getPublicUrl(fileName);

                      logoUrl = publicUrlData.publicUrl;
                    } catch (error) {
                      console.error('Error uploading logo:', error);
                      alert('Không thể tải lên logo. Vui lòng thử lại.');
                      return;
                    }
                  }

                  updateCompany(selectedCompany.id, {
                    name: editCompanyName,
                    code: editCompanyCode,
                    logo_url: logoUrl,
                  });
                  setIsEditModalOpen(false);
                  setEditCompanyName("");
                  setEditCompanyCode("");
                  setEditCompanyLogo(null);
                  setEditCompanyLogoPreview(null);
                }}
                disabled={!editCompanyName || !editCompanyCode}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanySwitcher;
