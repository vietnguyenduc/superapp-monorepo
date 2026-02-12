import React from "react";
import { useNavigate } from "react-router-dom";
import { useCompany } from "../../contexts/CompanyContext";
import type { Company } from "../../types/database.types";

const CompanySelector: React.FC = () => {
  const { companies, loading, error, setSelectedCompany } = useCompany();
  const navigate = useNavigate();

  const handleSelectCompany = (company: Company) => {
    setSelectedCompany(company);
    navigate("/dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-white text-xl">Loading companies...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-red-400 text-xl">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-6 sm:py-12 px-3 sm:px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2 sm:mb-4">
            Select Company
          </h1>
          <p className="text-gray-300 text-base sm:text-lg">
            Choose a company database to manage
          </p>
        </div>

        {/* Company Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {companies.map((company) => (
            <button
              key={company.id}
              onClick={() => handleSelectCompany(company)}
              className="group relative bg-white/10 backdrop-blur-lg rounded-2xl p-6 sm:p-8 border border-white/20 hover:border-purple-400 hover:bg-white/20 transition-all duration-300 text-left min-h-[44px]"
            >
              {/* Company Icon */}
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-xl sm:text-2xl font-bold text-white">
                  {company.name.charAt(0)}
                </span>
              </div>

              {/* Company Info */}
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                {company.name}
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Code: {company.code}
              </p>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400"></span>
                <span className="text-green-400 text-sm">Active</span>
              </div>

              {/* Hover Arrow */}
              <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300">
                <svg
                  className="w-6 h-6 text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </button>
          ))}
        </div>

        {/* Empty State */}
        {companies.length === 0 && (
          <div className="text-center py-16">
            <div className="text-gray-400 text-lg">
              No companies available
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanySelector;
