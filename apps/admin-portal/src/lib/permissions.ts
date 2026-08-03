export interface FeaturePermission {
  key: string;
  label: string;
}

export interface AppPermissionConfig {
  id: string;
  name: string;
  color: string;
  features: FeaturePermission[];
}

export const APP_PERMISSIONS: AppPermissionConfig[] = [
  {
    id: "cashflow",
    name: "Cashflow",
    color: "bg-blue-100 text-blue-800",
    features: [
      { key: "transactions.import_own", label: "Bulk import transactions" },
      { key: "transactions.manage_all", label: "Manage all transactions" },
      { key: "customers.import_own", label: "Import customers" },
      { key: "customers.manage_all", label: "Manage all customers" },
      { key: "reports.view", label: "View reports" },
      { key: "settings.edit_general", label: "Edit general settings" },
      { key: "settings.branches", label: "Manage branches" },
      { key: "settings.bank_accounts", label: "Manage bank accounts" },
      { key: "settings.transaction_types", label: "Manage transaction types" },
      { key: "settings.customer_fields", label: "Manage customer fields" },
      { key: "settings.color_settings", label: "Manage color settings" },
      { key: "settings.reports", label: "Manage report settings" },
    ],
  },
  {
    id: "accounting",
    name: "Accounting",
    color: "bg-purple-100 text-purple-800",
    features: [
      { key: "transactions.import_own", label: "Bulk import transactions" },
      { key: "transactions.manage_all", label: "Manage all transactions" },
      { key: "customers.import_own", label: "Import customers" },
      { key: "customers.manage_all", label: "Manage all customers" },
      { key: "reports.view", label: "View reports" },
      { key: "settings.edit_general", label: "Edit general settings" },
      { key: "settings.branches", label: "Manage branches" },
      { key: "settings.bank_accounts", label: "Manage bank accounts" },
      { key: "settings.transaction_types", label: "Manage transaction types" },
      { key: "settings.customer_fields", label: "Manage customer fields" },
      { key: "settings.color_settings", label: "Manage color settings" },
      { key: "settings.reports", label: "Manage report settings" },
    ],
  },
  {
    id: "inventory",
    name: "Inventory",
    color: "bg-amber-100 text-amber-800",
    features: [
      { key: "products.import_own", label: "Import products" },
      { key: "products.manage_all", label: "Manage all products" },
      { key: "inventory.import_own", label: "Import inventory" },
      { key: "inventory.manage_all", label: "Manage all inventory" },
      { key: "reports.view", label: "View reports" },
      { key: "settings.edit_general", label: "Edit general settings" },
      { key: "settings.branches", label: "Manage branches" },
      { key: "settings.warehouses", label: "Manage warehouses" },
      { key: "settings.product_categories", label: "Manage product categories" },
      { key: "settings.color_settings", label: "Manage color settings" },
      { key: "settings.reports", label: "Manage report settings" },
    ],
  },
  {
    id: "sales",
    name: "Sales",
    color: "bg-emerald-100 text-emerald-800",
    features: [
      { key: "products.import_own", label: "Import products" },
      { key: "products.manage_all", label: "Manage all products" },
      { key: "inventory.import_own", label: "Import inventory" },
      { key: "inventory.manage_all", label: "Manage all inventory" },
      { key: "reports.view", label: "View reports" },
      { key: "settings.edit_general", label: "Edit general settings" },
      { key: "settings.branches", label: "Manage branches" },
      { key: "settings.warehouses", label: "Manage warehouses" },
      { key: "settings.product_categories", label: "Manage product categories" },
      { key: "settings.color_settings", label: "Manage color settings" },
      { key: "settings.reports", label: "Manage report settings" },
    ],
  },
  {
    id: "hr",
    name: "HR & Payroll",
    color: "bg-pink-100 text-pink-800",
    features: [],
  },
  {
    id: "operations",
    name: "Operations",
    color: "bg-cyan-100 text-cyan-800",
    features: [],
  },
];

export type JsonObject = { [key: string]: JsonValue };
export type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];

export function getStaffPermission(
  permissions: JsonObject | undefined,
  path: string,
): boolean {
  return path.split(".").reduce<JsonValue | undefined>((acc, key) => {
    if (acc === undefined || acc === null) return undefined;
    if (typeof acc !== "object" || Array.isArray(acc)) return undefined;
    return (acc as JsonObject)[key];
  }, permissions as JsonValue) === true;
}

export function setStaffPermission(
  permissions: JsonObject | undefined,
  path: string,
  value: boolean,
): JsonObject {
  const cloned: JsonObject = permissions ? { ...permissions } : {};
  const keys = path.split(".");
  let node: JsonObject = cloned;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    const child = node[key];
    node[key] =
      child && typeof child === "object" && !Array.isArray(child)
        ? { ...child }
        : {};
    node = node[key] as JsonObject;
  }
  node[keys[keys.length - 1]] = value;
  return cloned;
}
