# Task List — Fix UI/UX Issues (7 apps)

## Step 1: hasPermission — inventory-operation
- [ ] Read AuthContextType interface (packages/iam)
- [ ] Read PermissionDemoPage (inventory-operation)
- [ ] Add hasPermission to AuthContextType + implement in AuthProvider
- [ ] Verify

## Step 2: i18n init — sales-operation, inventory-operation
- [ ] Read main.tsx của sales-operation
- [ ] Read main.tsx của inventory-operation
- [ ] Thêm i18n init
- [ ] Verify

## Step 3: Login route — operations-portal, hr-operation
- [ ] Read App.tsx của operations-portal
- [ ] Read App.tsx của hr-operation
- [ ] Thêm route /login
- [ ] Verify

## Step 4: trial-company UUID — packages/iam
- [ ] Read useAuth hook
- [ ] Sửa fetchUserProfile skip DB query khi trial
- [ ] Verify

## Step 5: PGRST201 — hr-operation
- [ ] Read query employees + departments
- [ ] Sửa relationship
- [ ] Verify

## Step 6: React Router future flags — ALL 7 apps
- [ ] Tìm BrowserRouter trong tất cả apps
- [ ] Thêm future flags
- [ ] Verify

## Step 7: Objects not valid child — cashflow
- [ ] Tìm error object render
- [ ] Sửa thành error.message
- [ ] Verify
