import { supabase } from "./supabase";
import { ApiResponse, PaginatedResponse } from "../types";
// import { API_CONFIG } from '../utils/constants' // Unused for now

// Base API service class
export class ApiService {
  private static instance: ApiService;

  private constructor() {}

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  // Generic GET request
  async get<T>(
    table: string,
    options?: {
      select?: string;
      filters?: Record<string, any>;
      orderBy?: { column: string; ascending?: boolean };
      limit?: number;
      offset?: number;
    },
  ): Promise<ApiResponse<T[]>> {
    try {
      let query = supabase.from(table).select(options?.select || "*");

      // Apply filters
      if (options?.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }

      // Apply ordering
      if (options?.orderBy) {
        query = query.order(options.orderBy.column, {
          ascending: options.orderBy.ascending ?? true,
        });
      }

      // Apply pagination
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        query = query.range(
          options.offset,
          options.offset + (options.limit || 10) - 1,
        );
      }

      const { data, error } = await query;

      if (error) {
        return {
          data: null,
          error: error.message,
          loading: false,
        };
      }

      return {
        data: (data as T[]) || [],
        error: null,
        loading: false,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
        loading: false,
      };
    }
  }

  // Generic GET by ID
  async getById<T>(
    table: string,
    id: string,
    select?: string,
  ): Promise<ApiResponse<T>> {
    try {
      const { data, error } = await supabase
        .from(table)
        .select(select || "*")
        .eq("id", id)
        .single();

      if (error) {
        return {
          data: null,
          error: error.message,
          loading: false,
        };
      }

      return {
        data: data as T,
        error: null,
        loading: false,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
        loading: false,
      };
    }
  }

  // Generic POST request
  async post<T>(table: string, data: Partial<T>): Promise<ApiResponse<T>> {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select()
        .single();

      if (error) {
        return {
          data: null,
          error: error.message,
          loading: false,
        };
      }

      return {
        data: result as T,
        error: null,
        loading: false,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
        loading: false,
      };
    }
  }

  // Generic PUT request
  async put<T>(
    table: string,
    id: string,
    data: Partial<T>,
  ): Promise<ApiResponse<T>> {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        return {
          data: null,
          error: error.message,
          loading: false,
        };
      }

      return {
        data: result as T,
        error: null,
        loading: false,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
        loading: false,
      };
    }
  }

  // Generic DELETE request
  async delete(table: string, id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase.from(table).delete().eq("id", id);

      if (error) {
        return {
          data: null,
          error: error.message,
          loading: false,
        };
      }

      return {
        data: true,
        error: null,
        loading: false,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
        loading: false,
      };
    }
  }

  // Paginated GET request
  async getPaginated<T>(
    table: string,
    page: number = 1,
    pageSize: number = 20,
    options?: {
      select?: string;
      filters?: Record<string, any>;
      orderBy?: { column: string; ascending?: boolean };
    },
  ): Promise<ApiResponse<PaginatedResponse<T>>> {
    try {
      const offset = (page - 1) * pageSize;

      // Get total count
      let countQuery = supabase
        .from(table)
        .select("*", { count: "exact", head: true });
      if (options?.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            countQuery = countQuery.eq(key, value);
          }
        });
      }
      const { count } = await countQuery;

      // Get data
      const dataResponse = await this.get<T>(table, {
        ...options,
        limit: pageSize,
        offset,
      });

      if (dataResponse.error) {
        return {
          data: null,
          error: dataResponse.error,
          loading: false,
        };
      }

      const totalPages = Math.ceil((count || 0) / pageSize);

      return {
        data: {
          data: dataResponse.data || [],
          count: count || 0,
          page,
          pageSize,
          totalPages,
        },
        error: null,
        loading: false,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
        loading: false,
      };
    }
  }

  // Bulk insert
  async bulkInsert<T>(
    table: string,
    data: Partial<T>[],
  ): Promise<ApiResponse<T[]>> {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select();

      if (error) {
        return {
          data: null,
          error: error.message,
          loading: false,
        };
      }

      return {
        data: (result as T[]) || [],
        error: null,
        loading: false,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
        loading: false,
      };
    }
  }

  // Search with full-text search
  async search<T>(
    table: string,
    searchTerm: string,
    searchColumns: string[],
    options?: {
      select?: string;
      filters?: Record<string, any>;
      limit?: number;
    },
  ): Promise<ApiResponse<T[]>> {
    try {
      let query = supabase.from(table).select(options?.select || "*");

      // Apply full-text search
      if (searchTerm && searchColumns.length > 0) {
        const searchQuery = searchColumns
          .map((column) => `${column}.ilike.%${searchTerm}%`)
          .join(",");
        query = query.or(searchQuery);
      }

      // Apply additional filters
      if (options?.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }

      // Apply limit
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        return {
          data: null,
          error: error.message,
          loading: false,
        };
      }

      return {
        data: (data as T[]) || [],
        error: null,
        loading: false,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
        loading: false,
      };
    }
  }
}

// Export singleton instance
export const apiService = ApiService.getInstance();
