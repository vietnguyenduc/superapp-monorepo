import React, { useState, useEffect } from "react";
import { ErrorFallback } from "../../components/UI/FallbackUI";
import ToggleSwitch from "../../components/UI/ToggleSwitch";
import Button from "../../components/UI/Button";
import { databaseService } from "../../services/database";
import { formatCurrency } from "../../utils/formatting";

interface TransactionType {
  id: string;
  name: string;
  color: string;
  description: string;
  isActive: boolean;
}

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountType: string;
  accountName: string;
  balance: number;
  isActive: boolean;
}

interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  isActive: boolean;
}

interface CustomerField {
  id: string;
  name: string;
  type: "text" | "email" | "phone" | "select" | "textarea";
  required: boolean;
  isActive: boolean;
  options?: string[];
}

// Định nghĩa type ImportField ở đầu file nếu chưa có:
type ImportField = {
  key: string;
  label: string;
  type: string;
  required: boolean;
  enabled: boolean;
  optionSource?: string;
  options?: string[];
};

const Settings: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("transaction-types");
  const [_loading, setLoading] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  // Load data from database service
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load bank accounts
        const bankAccountsResponse = await databaseService.bankAccounts.getBankAccounts();
        if (bankAccountsResponse.error) {
          throw new Error(bankAccountsResponse.error);
        }

        const formattedBankAccounts =
          bankAccountsResponse.data?.map((account: any) => ({
            id: account.id,
            bankName: account.bank_name,
            accountNumber: account.account_number,
            accountType: getAccountType(account.account_name),
            accountName: account.account_name,
            balance: account.balance,
            isActive: account.is_active,
          })) || [];

        setBankAccounts(formattedBankAccounts);

        // Load branches
        const branchesResponse = await databaseService.branches.getBranches();
        if (branchesResponse.error) {
          throw new Error(branchesResponse.error);
        }

        const formattedBranches =
          branchesResponse.data?.map((branch: any) => ({
            id: branch.id,
            name: branch.name,
            address: branch.address,
            phone: branch.phone,
            isActive: branch.is_active,
          })) || [];

        setBranches(formattedBranches);
        localStorage.setItem(
          "bankAccounts",
          JSON.stringify(formattedBankAccounts),
        );
        localStorage.setItem("branches", JSON.stringify(formattedBranches));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Lỗi khi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Helper function to determine account type based on account name
  const getAccountType = (accountName: string): string => {
    if (accountName.includes("chính")) return "TK Chính";
    if (accountName.includes("thanh toán")) return "TK Thanh toán";
    if (accountName.includes("tiết kiệm")) return "TK Tiết kiệm";
    if (accountName.includes("vốn lưu động")) return "TK Vốn lưu động";
    if (accountName.includes("dự phòng")) return "TK Dự phòng";
    return "TK Khác";
  };

  // Transaction Types
  const [transactionTypes, setTransactionTypes] = useState<TransactionType[]>([
    {
      id: "1",
      name: "Thanh toán",
      color: "green",
      description: "Khách hàng thanh toán nợ",
      isActive: true,
    },
    {
      id: "2",
      name: "Cho nợ",
      color: "red",
      description: "Cho khách hàng vay tiền",
      isActive: true,
    },
    {
      id: "3",
      name: "Điều chỉnh",
      color: "yellow",
      description: "Điều chỉnh số dư",
      isActive: true,
    },
    {
      id: "4",
      name: "Hoàn tiền",
      color: "blue",
      description: "Hoàn tiền cho khách hàng",
      isActive: true,
    },
  ]);

  // Customer Fields
  const [customerFields, setCustomerFields] = useState<CustomerField[]>([
    {
      id: "1",
      name: "Mã khách hàng",
      type: "text",
      required: true,
      isActive: true,
    },
    {
      id: "2",
      name: "Họ và tên",
      type: "text",
      required: true,
      isActive: true,
    },
    { id: "3", name: "Email", type: "email", required: false, isActive: true },
    {
      id: "4",
      name: "Số điện thoại",
      type: "phone",
      required: false,
      isActive: true,
    },
    {
      id: "5",
      name: "Địa chỉ",
      type: "textarea",
      required: false,
      isActive: true,
    },
    {
      id: "6",
      name: "Loại khách hàng",
      type: "select",
      required: false,
      isActive: true,
      options: ["Cá nhân", "Doanh nghiệp", "Tổ chức"],
    },
  ]);

  // Thêm vào mảng tabs:
  const tabs = [
    { id: "transaction-types", name: "Loại giao dịch", icon: "📊" },
    { id: "bank-accounts", name: "Tài khoản ngân hàng", icon: "🏦" },
    { id: "branches", name: "Chi nhánh", icon: "🏢" },
    { id: "customer-fields", name: "Trường khách hàng", icon: "👥" },
    { id: "import-fields", name: "Cài đặt trường import", icon: "📝" },
  ];

  // Thêm state và logic lưu cấu hình vào localStorage:
  const defaultImportFields = [
    {
      key: "customer_name",
      label: "Tên khách hàng",
      type: "text",
      required: true,
      enabled: true,
    },
    {
      key: "bank_account",
      label: "Số tài khoản ngân hàng",
      type: "bank-select",
      required: false,
      enabled: true,
    },
    {
      key: "branch",
      label: "Chi nhánh",
      type: "branch-select",
      required: false,
      enabled: true,
    },
    {
      key: "transaction_type",
      label: "Loại giao dịch",
      type: "select",
      required: true,
      enabled: true,
    },
    {
      key: "amount",
      label: "Số tiền",
      type: "number",
      required: true,
      enabled: true,
    },
    {
      key: "transaction_date",
      label: "Ngày giao dịch",
      type: "date",
      required: true,
      enabled: true,
    },
    {
      key: "document_number",
      label: "Số chứng từ",
      type: "document-number",
      required: false,
      enabled: true,
    },
    {
      key: "description",
      label: "Nội dung",
      type: "text",
      required: false,
      enabled: true,
    },
  ];
  // Cập nhật logic khởi tạo importFields:
  const [importFields, setImportFields] = useState(() => {
    const saved = localStorage.getItem("importFields");
    let fields = saved ? JSON.parse(saved) : [];
    // Merge các trường mẫu mới nếu thiếu
    defaultImportFields.forEach((def: ImportField) => {
      if (!fields.some((f: ImportField) => f.key === def.key)) {
        fields.push(def);
      }
    });
    if (fields.length === 0) fields = defaultImportFields;
    localStorage.setItem("importFields", JSON.stringify(fields));
    return fields;
  });
  // Bổ sung vào fieldTypes:
  const fieldTypes = [
    { value: "text", label: "Text" },
    { value: "number", label: "Number" },
    { value: "date", label: "Date" },
    { value: "select", label: "Select" },
    { value: "document-number", label: "Số chứng từ" },
  ];
  const handleFieldChange = (idx: number, prop: string, value: any) => {
    setImportFields((fields: ImportField[]) => {
      const updated = fields.map((f: ImportField, i: number) =>
        i === idx ? { ...f, [prop]: value } : f,
      );
      localStorage.setItem("importFields", JSON.stringify(updated));
      return updated;
    });
  };

  // Thêm hàm di chuyển trường lên/xuống:
  const moveField = (idx: number, direction: "up" | "down") => {
    setImportFields((fields: ImportField[]) => {
      const newFields = [...fields];
      if (direction === "up" && idx > 0) {
        [newFields[idx - 1], newFields[idx]] = [
          newFields[idx],
          newFields[idx - 1],
        ];
      }
      if (direction === "down" && idx < newFields.length - 1) {
        [newFields[idx], newFields[idx + 1]] = [
          newFields[idx + 1],
          newFields[idx],
        ];
      }
      localStorage.setItem("importFields", JSON.stringify(newFields));
      return newFields;
    });
  };
  // Thêm hàm xóa trường:
  const removeField = (idx: number) => {
    setImportFields((fields: ImportField[]) => {
      const newFields = fields.filter((_: ImportField, i: number) => i !== idx);
      localStorage.setItem("importFields", JSON.stringify(newFields));
      return newFields;
    });
  };
  // Thêm state cho form thêm trường mới:
  const [showAddField, setShowAddField] = useState(false);
  const [newField, setNewField] = useState({
    label: "",
    type: "text",
    required: false,
    enabled: true,
  });
  const handleAddField = () => {
    if (!newField.label.trim()) return;
    setImportFields((fields: ImportField[]) => {
      const updated = [...fields, { ...newField, key: Date.now().toString() }];
      localStorage.setItem("importFields", JSON.stringify(updated));
      return updated;
    });
    setShowAddField(false);
    setNewField({ label: "", type: "text", required: false, enabled: true });
  };

  // Color options for transaction types
  const colorOptions = [
    { value: "green", label: "Xanh lá", class: "bg-green-100 text-green-800" },
    { value: "red", label: "Đỏ", class: "bg-red-100 text-red-800" },
    { value: "blue", label: "Xanh dương", class: "bg-blue-100 text-blue-800" },
    { value: "yellow", label: "Vàng", class: "bg-yellow-100 text-yellow-800" },
    { value: "purple", label: "Tím", class: "bg-purple-100 text-purple-800" },
    { value: "gray", label: "Xám", class: "bg-gray-100 text-gray-800" },
  ];

  const getColorClass = (color: string) => {
    const colorOption = colorOptions.find(
      (opt: { value: string }) => opt.value === color,
    );
    return colorOption?.class || "bg-gray-100 text-gray-800";
  };

  const handleToggleActive = (type: string, id: string) => {
    switch (type) {
      case "transaction-type":
        setTransactionTypes((prev) =>
          prev.map((item: TransactionType) =>
            item.id === id ? { ...item, isActive: !item.isActive } : item,
          ),
        );
        break;
      case "bank-account":
        setBankAccounts((prev) =>
          prev.map((item: BankAccount) =>
            item.id === id ? { ...item, isActive: !item.isActive } : item,
          ),
        );
        break;
      case "branch":
        setBranches((prev) =>
          prev.map((item: Branch) =>
            item.id === id ? { ...item, isActive: !item.isActive } : item,
          ),
        );
        break;
      case "customer-field":
        setCustomerFields((prev) =>
          prev.map((item: CustomerField) =>
            item.id === id ? { ...item, isActive: !item.isActive } : item,
          ),
        );
        break;
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ErrorFallback
            title="Lỗi cấu hình"
            message={error}
            retry={() => setError(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Cài đặt hệ thống</h1>
          <p className="mt-2 text-gray-600">
            Quản lý cấu hình cơ bản cho hệ thống quản lý công nợ
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow">
          {/* Transaction Types */}
          {activeTab === "transaction-types" && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Loại giao dịch
                </h2>
                <Button variant="primary" size="md">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Thêm loại mới
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {transactionTypes.map((type) => (
                  <div
                    key={type.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getColorClass(type.color)}`}
                      >
                        {type.name}
                      </span>
                      <div className="flex items-center space-x-3">
                        <ToggleSwitch
                          checked={type.isActive}
                          onChange={() =>
                            handleToggleActive("transaction-type", type.id)
                          }
                          size="md"
                        />
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{type.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bank Accounts */}
          {activeTab === "bank-accounts" && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Tài khoản ngân hàng
                </h2>
                <Button variant="primary" size="md">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Thêm tài khoản
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ngân hàng
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Số tài khoản
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Loại tài khoản
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tên tài khoản
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Số dư
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bankAccounts.map((account) => (
                      <tr key={account.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {account.bankName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {account.accountNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {account.accountType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {account.accountName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(account.balance)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              account.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {account.isActive ? "Hoạt động" : "Không hoạt động"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-3">
                            <ToggleSwitch
                              checked={account.isActive}
                              onChange={() =>
                                handleToggleActive("bank-account", account.id)
                              }
                              size="sm"
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Branches */}
          {activeTab === "branches" && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Chi nhánh
                </h2>
                <Button variant="primary" size="md">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Thêm chi nhánh
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {branches.map((branch) => (
                  <div
                    key={branch.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        {branch.name}
                      </h3>
                      <div className="flex items-center space-x-3">
                        <ToggleSwitch
                          checked={branch.isActive}
                          onChange={() =>
                            handleToggleActive("branch", branch.id)
                          }
                          size="md"
                        />
                      </div>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">Địa chỉ:</span>{" "}
                        {branch.address}
                      </p>
                      <p>
                        <span className="font-medium">Điện thoại:</span>{" "}
                        {branch.phone}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customer Fields */}
          {activeTab === "customer-fields" && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Trường khách hàng
                </h2>
                <Button variant="primary" size="md">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Thêm trường
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tên trường
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Loại
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bắt buộc
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {customerFields.map((field) => (
                      <tr key={field.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {field.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="capitalize">{field.type}</span>
                          {field.options && (
                            <span className="text-xs text-gray-500 ml-2">
                              ({field.options.length} tùy chọn)
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              field.required
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {field.required ? "Bắt buộc" : "Tùy chọn"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              field.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {field.isActive ? "Hoạt động" : "Không hoạt động"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-3">
                            <ToggleSwitch
                              checked={field.isActive}
                              onChange={() =>
                                handleToggleActive("customer-field", field.id)
                              }
                              size="sm"
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Thêm UI cấu hình trường import khi activeTab === 'import-fields': */}
          {activeTab === "import-fields" && (
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                Cài đặt trường import
              </h2>
              <table className="min-w-full border text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-2 py-1 border">Trường</th>
                    <th className="px-2 py-1 border">Kiểu dữ liệu</th>
                    <th className="px-2 py-1 border">Bắt buộc</th>
                    <th className="px-2 py-1 border">Bật</th>
                    <th className="px-2 py-1 border">Sắp xếp</th>
                    <th className="px-2 py-1 border">Xóa</th>
                  </tr>
                </thead>
                <tbody>
                  {importFields.map((f: ImportField, idx: number) => (
                    <tr key={f.key}>
                      <td className="px-2 py-1 border">{f.label}</td>
                      <td className="px-2 py-1 border">
                        {(() => {
                          // Cứng quy tắc cho 2 trường
                          if (
                            f.label === "Loại giao dịch" ||
                            f.key === "transaction_type"
                          ) {
                            return (
                              <>
                                <select
                                  value="select"
                                  disabled
                                  className="border rounded px-1 py-0.5"
                                >
                                  <option value="select">Select</option>
                                </select>
                                <div className="mt-1">
                                  <label>
                                    <input type="radio" checked readOnly /> Loại
                                    giao dịch hệ thống
                                  </label>
                                </div>
                              </>
                            );
                          }
                          if (
                            f.label === "Tài khoản ngân hàng" ||
                            f.key === "bank_account"
                          ) {
                            return (
                              <>
                                <select
                                  value="select"
                                  disabled
                                  className="border rounded px-1 py-0.5"
                                >
                                  <option value="select">Select</option>
                                </select>
                                <div className="mt-1">
                                  <label>
                                    <input type="radio" checked readOnly /> Ngân
                                    hàng
                                  </label>
                                </div>
                              </>
                            );
                          }
                          // Trường khác giữ logic như cũ
                          return (
                            <>
                              <select
                                value={f.type}
                                onChange={(e) =>
                                  handleFieldChange(idx, "type", e.target.value)
                                }
                                className="border rounded px-1 py-0.5"
                              >
                                {fieldTypes.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                              {f.type === "select" && (
                                <div className="mt-1">
                                  <label className="mr-2">
                                    <input
                                      type="radio"
                                      name={`optionSource-${idx}`}
                                      checked={
                                        f.optionSource === "manual" ||
                                        !f.optionSource
                                      }
                                      onChange={() =>
                                        handleFieldChange(
                                          idx,
                                          "optionSource",
                                          "manual",
                                        )
                                      }
                                    />{" "}
                                    Tự nhập
                                  </label>
                                  <label className="mr-2">
                                    <input
                                      type="radio"
                                      name={`optionSource-${idx}`}
                                      checked={f.optionSource === "bank"}
                                      onChange={() =>
                                        handleFieldChange(
                                          idx,
                                          "optionSource",
                                          "bank",
                                        )
                                      }
                                    />{" "}
                                    Ngân hàng
                                  </label>
                                  <label>
                                    <input
                                      type="radio"
                                      name={`optionSource-${idx}`}
                                      checked={f.optionSource === "branch"}
                                      onChange={() =>
                                        handleFieldChange(
                                          idx,
                                          "optionSource",
                                          "branch",
                                        )
                                      }
                                    />{" "}
                                    Chi nhánh
                                  </label>
                                  {(!f.optionSource ||
                                    f.optionSource === "manual") && (
                                    <input
                                      type="text"
                                      placeholder="Nhập các giá trị, cách nhau bởi dấu phẩy"
                                      value={
                                        f.options ? f.options.join(", ") : ""
                                      }
                                      onChange={(e) =>
                                        handleFieldChange(
                                          idx,
                                          "options",
                                          e.target.value
                                            .split(",")
                                            .map((s) => s.trim())
                                            .filter(Boolean),
                                        )
                                      }
                                      className="border rounded px-1 py-0.5 mt-1 w-full"
                                    />
                                  )}
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </td>
                      <td className="px-2 py-1 border text-center">
                        <input
                          type="checkbox"
                          checked={f.required}
                          onChange={(e) =>
                            handleFieldChange(idx, "required", e.target.checked)
                          }
                        />
                      </td>
                      <td className="px-2 py-1 border text-center">
                        <input
                          type="checkbox"
                          checked={f.enabled}
                          onChange={(e) =>
                            handleFieldChange(idx, "enabled", e.target.checked)
                          }
                        />
                      </td>
                      <td className="px-2 py-1 border text-center">
                        <button
                          onClick={() => moveField(idx, "up")}
                          disabled={idx === 0}
                          className="mr-1 px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveField(idx, "down")}
                          disabled={idx === importFields.length - 1}
                          className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                        >
                          ↓
                        </button>
                      </td>
                      <td className="px-2 py-1 border text-center">
                        <button
                          onClick={() => removeField(idx)}
                          className="px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4">
                {!showAddField ? (
                  <button
                    onClick={() => setShowAddField(true)}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    + Thêm trường mới
                  </button>
                ) : (
                  <div className="flex items-center space-x-2 mt-2">
                    <input
                      type="text"
                      placeholder="Tên trường"
                      value={newField.label}
                      onChange={(e) =>
                        setNewField((f) => ({ ...f, label: e.target.value }))
                      }
                      className="border rounded px-2 py-1"
                    />
                    <select
                      value={newField.type}
                      onChange={(e) =>
                        setNewField((f) => ({ ...f, type: e.target.value }))
                      }
                      className="border rounded px-2 py-1"
                    >
                      {fieldTypes.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newField.required}
                        onChange={(e) =>
                          setNewField((f) => ({
                            ...f,
                            required: e.target.checked,
                          }))
                        }
                        className="mr-1"
                      />{" "}
                      Bắt buộc
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newField.enabled}
                        onChange={(e) =>
                          setNewField((f) => ({
                            ...f,
                            enabled: e.target.checked,
                          }))
                        }
                        className="mr-1"
                      />{" "}
                      Bật
                    </label>
                    <button
                      onClick={handleAddField}
                      className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      Lưu
                    </button>
                    <button
                      onClick={() => setShowAddField(false)}
                      className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                    >
                      Hủy
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
