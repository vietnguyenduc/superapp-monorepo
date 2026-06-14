# Task Objective
🖼️ [Google Vision OCR & Analysis]
```text
The image is a screenshot of a mobile application, likely an inventory or supply chain management tool.

**Top Bar:**
*   The top left corner displays "23:39" and a bed icon.
*   A blue "TELEGRAM" button is centered at the top.
*   To the right of "TELEGRAM", there are signal strength icons, a Wi-Fi icon, and the number "84".
*   Below the "TELEGRAM" button, there is text that appears to be a URL or domain name: "DOH Trung bình toàn kho impulse-zap-mothproof.ngro...".
*   A black "X" icon is on the left side of the URL bar.
*   Three black dots are on the right side of the URL bar.

**Main Content Area:**
*   A hamburger menu icon is on the left, followed by the text "Inventory Op" and a purple building icon, then "tion" and a grid icon.
*   To the right of "Inventory Op tion", there is a white rounded rectangle with "T" and a down arrow inside.

*   **Section 1: Stock**
    *   A pink circle with a red downward-trending graph icon.
    *   Text: "stock)"
    *   Large red number "1" followed by "sản phẩm".

*   **Section 2: Purchase Order Suggestion**
    *   A light green circle with a shopping cart icon.
    *   Text: "Đề xuất mua hàng (PO)"
    *   Large green number "2" followed by "nhà cung cấp".

*   **Search and Filter Bar:**
    *   A white rounded rectangle with a magnifying glass icon and "Tìm sản".
    *   A white rounded rectangle with a filter icon (Y shape) and "Lọc".
    *   A purple rectangular button with a shopping cart icon and text "Tạo PO hàng loạt".

*   **Data Cards:**
    *   **Card 1 (Left):**
        *   Text: "DOH THỰC TẾ"
        *   Large number "10"
        *   Text: "NGÀY"
    *   **Card 2 (Middle-Left):**
        *   Text: "NỢ NCC / LEAD TIME"
        *   Large number "30"
        *   Text: "ngày nợ"
    *   **Card 3 (Middle-Right):**
        *   Text: "GỢI Ý ĐẶT (MRP)"
        *   Large text "+3,000"
        *   Text: "~ 45.000.00"
    *   **Floating Action Button:** A large blue circle with a white "+" icon is in the bottom right of this section.

**Bottom Navigation Bar:**
*   A black bar at the very bottom with rounded corners.
*   Icons and text labels:
    *   A briefcase icon: "Dashboard"
    *   A box icon: "Sản phẩm"
    *   A bar chart icon: "Tồn kho"
    *   A graph icon: "Báo cáo"
    *   A gear icon: "Cài đặt"
*   A left arrow icon and a right arrow icon are centered within the black bar.
*   A document upload icon and a bookmark icon are also present in the black bar.
```

Yêu cầu của người dùng đối với hình ảnh trên: Lỗi ui ux: header lộn xộn,nút bấm tạo PO tìm và lọc lộn xộn, nút cộng bên trái bên dưới đè vào nút setting

# Strategy Used
Direct self-healing command execution.

# Code Snippets (Skills)
🌐 *[INVENTORY-OPERATION]* _[DeepSeek]_

Now I have a clear picture of all the UI/UX issues. Let me create the implementation plan.

## 📋 **Phân tích & Kế hoạch Fix UI/UX — Inventory MRP Page**

Dựa trên ảnh chụp màn hình và code, tôi phát hiện **4 vấn đề chính**:

---

### 🚨 **Vấn đề 1: Header lộn xộn (Navigation.tsx)**
- **Mô tả:** User name + role hiển thị ở 2 nơi: trong avatar dropdown và ở `div.hidden.lg:block` bên cạnh → gây rối mắt
- **Fix:** Xóa `div.hidden.lg:block` thừa (dòng 120-127), 

# Lessons Learned
Execution completed with success=True and complexity=medium.