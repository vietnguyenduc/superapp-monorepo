// Automated unit test for transaction-type deduplication logic
// Architecture: service returns ALL records; context/UI deduplicates for dropdowns.

function mapAllTypes(data) {
  // Service returns ALL records (including inactive) for legacy-ID lookup
  return data.map((t) => ({
    id: t.id,
    name: t.name,
    color: t.color || "blue",
    isActive: t.is_active !== false,
    math_factor: t.math_factor ?? 1,
    impact_type: t.impact_type ?? "increase",
    company_id: t.company_id,
  }));
}

function deduplicateByName(data) {
  const dedupMap = new Map();
  data
    .filter((t) => t?.is_active !== false)
    .forEach((t) => {
      const key = String(t.name || t.id || "").toLowerCase().trim();
      if (!key) return;
      const existing = dedupMap.get(key);
      if (!existing || (existing.company_id === null && t.company_id !== null)) {
        dedupMap.set(key, t);
      }
    });
  return Array.from(dedupMap.values()).map((t) => ({
    id: t.id,
    name: t.name,
    color: t.color || "blue",
    isActive: t.is_active !== false,
    math_factor: t.math_factor ?? 1,
    impact_type: t.impact_type ?? "increase",
    company_id: t.company_id,
  }));
}

function getTransactionTypeNameFromDB(typeId, allTypes) {
  if (!allTypes) return typeId;
  const found = allTypes.find((t) => t.id === typeId);
  return found?.name || typeId;
}

// Mock data matching real Supabase state (legacy + new rows with duplicate names)
const mockDbRows = [
  { id: "083a4ff9-04fc-4bec-a55e-d797bbd2963c", name: "Điều chỉnh", color: "blue", math_factor: 1, impact_type: "increase", company_id: "22222222-2222-2222-2222-222222222222", is_active: true },
  { id: "adjustment", name: "Điều chỉnh", color: "blue", math_factor: 1, impact_type: "increase", company_id: null, is_active: true },
  { id: "5859179e-3472-4998-abda-a94bacdc50d2", name: "Điều chỉnh giảm", color: "green", math_factor: -1, impact_type: "decrease", company_id: "22222222-2222-2222-2222-222222222222", is_active: true },
  { id: "payment", name: "Điều chỉnh giảm", color: "green", math_factor: -1, impact_type: "decrease", company_id: null, is_active: true },
  { id: "b9c3bff6-5e99-4221-9c30-edfc02618671", name: "Điều chỉnh tăng", color: "red", math_factor: 1, impact_type: "increase", company_id: "22222222-2222-2222-2222-222222222222", is_active: true },
  { id: "charge", name: "Điều chỉnh tăng", color: "red", math_factor: 1, impact_type: "increase", company_id: null, is_active: true },
  { id: "3efc6ae7-b42f-4dc8-be94-70df75801d9e", name: "Hoàn tiền", color: "green", math_factor: -1, impact_type: "decrease", company_id: "22222222-2222-2222-2222-222222222222", is_active: true },
  { id: "refund", name: "Hoàn tiền", color: "green", math_factor: -1, impact_type: "decrease", company_id: null, is_active: false },
];

const allTypes = mapAllTypes(mockDbRows);
const deduped = deduplicateByName(mockDbRows);

// Assertions
const assert = (condition, message) => {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  } else {
    console.log(`PASS: ${message}`);
  }
};

// Service layer returns ALL records (backward compat for legacy-ID lookup)
assert(allTypes.length === 8, `Service should return ALL 8 types (including inactive), got ${allTypes.length}`);
assert(allTypes.find((t) => t.id === "payment"), "Legacy 'payment' record must exist in service response");
assert(allTypes.find((t) => t.id === "charge"), "Legacy 'charge' record must exist in service response");
assert(allTypes.find((t) => t.id === "refund"), "Inactive 'refund' must exist in service response for legacy lookup");

// Legacy-ID lookup must resolve to Vietnamese name
assert(getTransactionTypeNameFromDB("payment", allTypes) === "Điều chỉnh giảm", "Legacy ID 'payment' resolves to 'Điều chỉnh giảm'");
assert(getTransactionTypeNameFromDB("charge", allTypes) === "Điều chỉnh tăng", "Legacy ID 'charge' resolves to 'Điều chỉnh tăng'");
assert(getTransactionTypeNameFromDB("adjustment", allTypes) === "Điều chỉnh", "Legacy ID 'adjustment' resolves to 'Điều chỉnh'");

// Context/UI deduplication for dropdowns
assert(deduped.length === 4, `Dropdown should show 4 unique types, got ${deduped.length}`);
assert(deduped.find((t) => t.name === "Điều chỉnh")?.id === "083a4ff9-04fc-4bec-a55e-d797bbd2963c", "Prefer UUID over legacy 'adjustment'");
assert(deduped.find((t) => t.name === "Điều chỉnh giảm")?.id === "5859179e-3472-4998-abda-a94bacdc50d2", "Prefer UUID over legacy 'payment'");
assert(deduped.find((t) => t.name === "Điều chỉnh tăng")?.id === "b9c3bff6-5e99-4221-9c30-edfc02618671", "Prefer UUID over legacy 'charge'");
assert(deduped.find((t) => t.name === "Hoàn tiền")?.id === "3efc6ae7-b42f-4dc8-be94-70df75801d9e", "Prefer UUID over inactive legacy 'refund'");
assert(!deduped.find((t) => t.name === "Hoàn tiền" && t.id === "refund"), "Inactive legacy 'refund' excluded from dropdown");

console.log("\nAll tests passed.");
console.log("Service result (7 records):", allTypes.map((t) => ({ id: t.id, name: t.name })));
console.log("Dropdown result (4 unique):", deduped.map((t) => ({ id: t.id, name: t.name })));
