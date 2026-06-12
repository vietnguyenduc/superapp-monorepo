import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useProducts } from '../useProducts';
import { ProductService } from '../../services/productService';

vi.mock('../../services/productService', () => ({
  ProductService: {
    getProducts: vi.fn(),
    createProduct: vi.fn(),
    getProduct: vi.fn(),
  },
}));

describe('useProducts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with empty products and loading state', () => {
    (ProductService.getProducts as any).mockResolvedValue({ success: true, data: [] });

    const { result } = renderHook(() => useProducts());

    expect(result.current.products).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('loads products on mount', async () => {
    const mockProducts = [
      { id: '1', name: 'Product A', businessCode: 'SP001', category: 'fruit' },
      { id: '2', name: 'Product B', businessCode: 'SP002', category: 'dry_goods' },
    ];

    (ProductService.getProducts as any).mockResolvedValue({ success: true, data: mockProducts });

    const { result } = renderHook(() => useProducts());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.products).toHaveLength(2);
    expect(result.current.products[0].name).toBe('Product A');
    expect(result.current.error).toBeNull();
  });

  it('sets error when fetch fails', async () => {
    (ProductService.getProducts as any).mockResolvedValue({ success: false, error: 'Database error' });

    const { result } = renderHook(() => useProducts());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.products).toEqual([]);
    expect(result.current.error).toBe('Database error');
  });

  it('sets error when fetch throws', async () => {
    (ProductService.getProducts as any).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useProducts());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Lỗi tải danh sách sản phẩm');
  });

  it('creates a product and prepends to list', async () => {
    (ProductService.getProducts as any).mockResolvedValue({ success: true, data: [] });
    const newProduct = { id: '3', name: 'New Product', businessCode: 'SP003', category: 'fruit' };
    (ProductService.createProduct as any).mockResolvedValue({ success: true, data: newProduct });

    const { result } = renderHook(() => useProducts());

    await waitFor(() => expect(result.current.loading).toBe(false));

    let created;
    await act(async () => {
      created = await result.current.createProduct({
        name: 'New Product', businessCode: 'SP003', category: 'fruit', inputUnit: 'kg', outputUnit: 'kg',
      } as any);
    });

    expect(created).toEqual(newProduct);
    expect(result.current.products).toHaveLength(1);
    expect(result.current.products[0].name).toBe('New Product');
  });

  it('getProductById returns product', async () => {
    const mockProduct = { id: '1', name: 'Product A', businessCode: 'SP001' };
    (ProductService.getProducts as any).mockResolvedValue({ success: true, data: [] });
    (ProductService.getProduct as any).mockResolvedValue({ success: true, data: mockProduct });

    const { result } = renderHook(() => useProducts());

    await waitFor(() => expect(result.current.loading).toBe(false));

    const product = await result.current.getProductById('1');
    expect(product).toEqual(mockProduct);
  });

  it('getProductById returns null when not found', async () => {
    (ProductService.getProducts as any).mockResolvedValue({ success: true, data: [] });
    (ProductService.getProduct as any).mockResolvedValue({ success: true, data: null });

    const { result } = renderHook(() => useProducts());

    await waitFor(() => expect(result.current.loading).toBe(false));

    const product = await result.current.getProductById('999');
    expect(product).toBeNull();
  });

  it('clearError resets error state', async () => {
    (ProductService.getProducts as any).mockResolvedValue({ success: false, error: 'Some error' });

    const { result } = renderHook(() => useProducts());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Some error');

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('fetchProducts reloads products', async () => {
    (ProductService.getProducts as any).mockResolvedValueOnce({ success: true, data: [{ id: '1', name: 'Initial' }] });

    const { result } = renderHook(() => useProducts());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.products).toHaveLength(1);

    (ProductService.getProducts as any).mockResolvedValueOnce({ success: true, data: [{ id: '2', name: 'Reloaded' }] });

    await act(async () => {
      await result.current.fetchProducts();
    });

    expect(result.current.products).toHaveLength(1);
    expect(result.current.products[0].name).toBe('Reloaded');
  });
});
