# Task Objective
Kiểm tra và đánh giá mức độ thân thiện với thiết bị di động (responsive mobile friendly) của toàn bộ các ứng dụng trong hệ thống.

# Strategy Used
Thực hiện một cuộc kiểm toán toàn diện về khả năng responsive mobile cho từng ứng dụng. Chiến lược bao gồm việc kiểm tra các tiêu chí cụ thể sau:
1.  **Meta viewport tag:** Đảm bảo có `width=device-width, initial-scale=1.0`.
2.  **Sidebar mobile (drawer):** Kiểm tra sự hiện diện và hoạt động của sidebar dạng drawer trên mobile, cùng với animation và lớp phủ.
3.  **Hamburger button:** Xác định nút hamburger để mở sidebar trên mobile.
4.  **Bottom navigation (mobile):** Kiểm tra sự tồn tại và cấu trúc của thanh điều hướng dưới cùng trên mobile.
5.  **FAB button:** Xác định các nút hành động nổi (Floating Action Button) và vị trí của chúng.
6.  **Padding và spacing:** Đánh giá việc sử dụng `pb-` và `px-` responsive để tránh nội dung bị che khuất hoặc tràn.
7.  **Safe-area-bottom:** Kiểm tra việc triển khai `safe-area-inset-bottom` để xử lý các vùng an toàn của thiết bị.
8.  **Header responsive:** Đánh giá cách header điều chỉnh trên các kích thước màn hình khác nhau.
9.  **Data tables:** Kiểm tra cách các bảng dữ liệu xử lý trên mobile (ví dụ: `overflow-x-auto`).
10. **Shared UI components:** Đánh giá tính responsive của các component UI dùng chung như `DataTable` và `Modal`.

Sau khi kiểm tra từng ứng dụng, một bảng tổng quan điểm số được tạo ra, cùng với danh sách các vấn đề cần ưu tiên sửa chữa (P0, P1, P2, P3).

# Code Snippets (Skills)
*   **HTML/Meta Tag:**
    ```html
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    ```
*   **Tailwind CSS Classes for Layout & Responsiveness:**
    *   **Sidebar/Drawer:**
        ```css
        fixed inset-y-0 left-0 z-50 w-72 sm:w-80
        lg:hidden
        hidden lg:flex
        hidden lg:block
        ```
    *   **Padding:**
        ```css
        px-4 sm:px-6 lg:px-8
        pb-24 sm:pb-8
        pb-20 lg:pb-8
        pb-20 lg:pb-0
        ```
    *   **FAB:**
        ```css
        fixed bottom-4 right-4
        ```
    *   **Data Tables:**
        ```css
        overflow-x-auto
        whitespace-nowrap
        ```
    *   **Modals:**
        ```css
        max-w-md
        max-w-[calc(100vw-2rem)]
        w-full max-w-md mx-4
        ```
    *   **Overlay:**
        ```css
        backdrop-blur-sm
        ```
*   **CSS for Safe Area:**
    ```css
    .safe-area-bottom { padding-bottom: env(safe-area-inset-bottom) }
    ```
*   **React Component Names (implied usage):**
    *   `MobileBottomNav`
    *   `BottomTabBar`
    *   `MobileMenuDrawer`
    *   `DataTable`
    *   `Modal`

# Lessons Learned
*   **Succeeded:**
    *   Thực hiện thành công một cuộc kiểm toán chi tiết, cung cấp cái nhìn toàn diện về tình trạng responsive mobile của tất cả các ứng dụng.
    *   Xác định rõ ràng các ứng dụng có khả năng responsive tốt nhất (`hr-operation`, `operations-portal`, `inventory-operation`) và các thực hành tốt nhất của chúng (bottom nav, safe-area, responsive padding).
    *   Phân loại và ưu tiên các vấn đề cần khắc phục, tạo ra một lộ trình rõ ràng cho các bước phát triển tiếp theo.
    *   Phát hiện các vấn đề responsive trong các component UI dùng chung (`DataTable`, `Modal`) có thể ảnh hưởng đến nhiều ứng dụng.
*   **Failed/Areas for Improvement:**
    *   `admin-portal` hoàn toàn không responsive, cần ưu tiên sửa chữa cao nhất.
    *   Một số ứng dụng quan trọng (`accounting`, `cashflow`, `sales-operation`) thiếu thanh điều hướng dưới cùng (bottom navigation) trên mobile, gây khó khăn cho trải nghiệm người dùng.
    *   Nhiều ứng dụng bỏ qua việc triển khai `safe-area-bottom` và quản lý `pb` spacing không nhất quán, có thể dẫn đến nội dung bị che khuất trên các thiết bị hiện đại.
    *   Các bảng dữ liệu (`DataTable`) trong `packages/ui` chưa được tối ưu hoàn toàn cho mobile, với `whitespace-nowrap` gây tràn màn hình.
    *   Các modal (`Modal`) có `max-w-md` cố định có thể không hoạt động tốt trên các màn hình mobile rất nhỏ.
*   **How errors were healed (proposed solutions):**
    *   Đề xuất triển khai đầy đủ các cơ chế responsive (sidebar drawer, hamburger, bottom nav, safe-area, responsive padding) cho `admin-portal`.
    *   Đề xuất thêm `MobileBottomNav` hoặc `BottomTabBar` cho các ứng dụng thiếu.
    *   Đề xuất chuẩn hóa việc sử dụng `safe-area-bottom` và `pb` spacing.
    *   Đề xuất cải thiện tính responsive của `DataTable` (ví dụ: card view hoặc scroll ngang tốt hơn) và `Modal` (ví dụ: `max-w-[calc(100vw-2rem)]`).