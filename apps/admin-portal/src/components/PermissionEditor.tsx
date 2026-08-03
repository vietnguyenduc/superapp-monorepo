import React, { useState } from "react";
import { X, Check, Shield, LayoutGrid, ChevronDown, ChevronUp } from "lucide-react";
import {
  APP_PERMISSIONS,
  getStaffPermission,
  setStaffPermission,
  type JsonObject,
} from "../lib/permissions";

export interface UserClaim {
  id: string;
  email: string;
  full_name: string;
  role: string;
  company_id?: string | null;
  app_permissions: Record<string, boolean>;
  staff_permissions?: JsonObject;
}

interface PermissionEditorProps {
  user: UserClaim | null;
  companies: { id: string; name: string }[];
  onSave: (user: UserClaim) => void;
  onClose: () => void;
  loading?: boolean;
}

export default function PermissionEditor({
  user,
  companies,
  onSave,
  onClose,
  loading,
}: PermissionEditorProps) {
  const [draft, setDraft] = useState<UserClaim | null>(() =>
    user
      ? {
          ...user,
          app_permissions: { ...user.app_permissions },
          staff_permissions: user.staff_permissions ? { ...user.staff_permissions } : {},
        }
      : null,
  );
  const [expandedApps, setExpandedApps] = useState<Record<string, boolean>>(() => {
    const first = APP_PERMISSIONS.find((app) => app.features.length > 0);
    return first ? { [first.id]: true } : {};
  });

  if (!draft) return null;

  const toggleAppAccess = (appId: string) => {
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        app_permissions: {
          ...prev.app_permissions,
          [appId]: !prev.app_permissions[appId],
        },
      };
    });
  };

  const toggleFeature = (appId: string, key: string) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const current = getStaffPermission(prev.staff_permissions, key);
      return {
        ...prev,
        staff_permissions: setStaffPermission(
          prev.staff_permissions,
          key,
          !current,
        ),
      };
    });
  };

  const changeRole = (role: string) => {
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        role,
        company_id: role === "admin_master" ? null : prev.company_id,
      };
    });
  };

  const changeCompany = (companyId: string | null) => {
    setDraft((prev) => (prev ? { ...prev, company_id: companyId } : prev));
  };

  const toggleExpanded = (appId: string) => {
    setExpandedApps((prev) => ({ ...prev, [appId]: !prev[appId] }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={!loading ? onClose : undefined}
      />
      <div className="relative w-full max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] sm:max-h-[85vh] flex flex-col mt-auto sm:mt-0">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Shield className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {draft.full_name || "No Name"}
              </h3>
              <p className="text-sm text-gray-500">{draft.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-5 space-y-6">
          {/* Role & Company */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Role
              </label>
              <select
                value={draft.role}
                onChange={(e) => changeRole(e.target.value)}
                disabled={loading}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                <option value="admin_master">Master Admin</option>
                <option value="admin_company">Company Admin</option>
                <option value="branch_manager">Branch Mgr</option>
                <option value="staff">Staff</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Company
              </label>
              <select
                value={draft.role === "admin_master" ? "" : (draft.company_id || "")}
                onChange={(e) => changeCompany(e.target.value || null)}
                disabled={loading || draft.role === "admin_master"}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                <option value="">Unassigned</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* App access */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <LayoutGrid className="w-4 h-4 text-gray-500" />
              <h4 className="text-sm font-semibold text-gray-900">App Access</h4>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {APP_PERMISSIONS.map((app) => {
                const hasAccess = draft.app_permissions?.[app.id] ?? false;
                return (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => toggleAppAccess(app.id)}
                    disabled={loading}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors disabled:opacity-50 ${
                      hasAccess
                        ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span className={`px-2 py-0.5 rounded text-xs ${app.color}`}>
                      {app.name}
                    </span>
                    {hasAccess ? (
                      <Check className="w-4 h-4 text-indigo-600" />
                    ) : (
                      <X className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Feature permissions per app */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-900">
              Feature Permissions
            </h4>
            <p className="text-xs text-gray-500 -mt-2">
              Enable specific features for each app. Feature permissions only take effect when the app access is granted above.
            </p>
            {APP_PERMISSIONS.filter((app) => app.features.length > 0).map((app) => {
              const hasAccess = draft.app_permissions?.[app.id] ?? false;
              const expanded = !!expandedApps[app.id];
              return (
                <div
                  key={app.id}
                  className={`border rounded-xl overflow-hidden transition-opacity ${
                    hasAccess ? "border-gray-200" : "border-gray-100 opacity-60"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleExpanded(app.id)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${app.color}`}>
                        {app.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {app.features.length} features
                      </span>
                    </div>
                    {expanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                  {expanded && (
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {app.features.map((feature) => {
                        const checked = getStaffPermission(
                          draft.staff_permissions,
                          feature.key,
                        );
                        return (
                          <button
                            key={feature.key}
                            type="button"
                            disabled={loading || !hasAccess}
                            onClick={() => toggleFeature(app.id, feature.key)}
                            className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-colors disabled:opacity-50 ${
                              checked
                                ? "border-indigo-200 bg-indigo-50"
                                : "border-gray-200 bg-white hover:bg-gray-50"
                            }`}
                          >
                            <div
                              className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                                checked
                                  ? "bg-indigo-600 text-white"
                                  : "border-2 border-gray-300"
                              }`}
                            >
                              {checked && <Check className="w-3.5 h-3.5" />}
                            </div>
                            <span className="text-sm text-gray-700">
                              {feature.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(draft)}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Permissions"}
          </button>
        </div>
      </div>
    </div>
  );
}
