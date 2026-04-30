// Data Abstraction Layer
// Provides unified interface for data operations regardless of data source (localStorage vs Supabase)

import { supabase } from "./supabase";
import { getTrialMode } from "./trialMockStore";
import { trialGet, trialInsert, trialUpdate, trialDelete } from "./trialMockStore";

// Data source types
export type DataSource = "localStorage" | "supabase";

// Query filter interface
export interface QueryFilter {
  field: string;
  operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "like" | "in";
  value: any;
}

// Sort interface
export interface SortOption {
  field: string;
  ascending: boolean;
}

// Data Adapter Interface
export interface DataAdapter {
  // CRUD operations
  get<T>(table: string, filters?: QueryFilter[]): Promise<T[]>;
  getById<T>(table: string, id: string): Promise<T | null>;
  insert<T>(table: string, data: T): Promise<T>;
  update<T>(table: string, id: string, data: Partial<T>): Promise<T>;
  delete(table: string, id: string): Promise<void>;
  
  // Query operations
  count(table: string, filters?: QueryFilter[]): Promise<number>;
  
  // Batch operations
  batchInsert<T>(table: string, data: T[]): Promise<T[]>;
  batchUpdate<T>(table: string, updates: Array<{ id: string; data: Partial<T> }>): Promise<T[]>;
  batchDelete(table: string, ids: string[]): Promise<void>;
}

// LocalStorage Adapter Implementation
class LocalStorageAdapter implements DataAdapter {
  private getStoreData(table: string): any[] {
    const data = trialGet(table);
    return data || [];
  }

  async get<T>(table: string, filters?: QueryFilter[]): Promise<T[]> {
    let data = this.getStoreData(table);
    
    if (filters && filters.length > 0) {
      data = data.filter((item: any) => {
        return filters.every(filter => {
          const itemValue = item[filter.field];
          switch (filter.operator) {
            case "eq":
              return itemValue === filter.value;
            case "neq":
              return itemValue !== filter.value;
            case "gt":
              return itemValue > filter.value;
            case "gte":
              return itemValue >= filter.value;
            case "lt":
              return itemValue < filter.value;
            case "lte":
              return itemValue <= filter.value;
            case "like":
              return String(itemValue).toLowerCase().includes(String(filter.value).toLowerCase());
            case "in":
              return Array.isArray(filter.value) && filter.value.includes(itemValue);
            default:
              return true;
          }
        });
      });
    }
    
    return data as T[];
  }

  async getById<T>(table: string, id: string): Promise<T | null> {
    const data = this.getStoreData(table);
    const item = data.find((item: any) => item.id === id);
    return item || null;
  }

  async insert<T>(table: string, data: T): Promise<T> {
    const inserted = trialInsert(table, data);
    if (!inserted) {
      throw new Error(`Failed to insert into ${table}`);
    }
    return inserted as T;
  }

  async update<T>(table: string, id: string, data: Partial<T>): Promise<T> {
    const updated = trialUpdate(table, id, data);
    if (!updated) {
      throw new Error(`Failed to update ${table} with id ${id}`);
    }
    return updated as T;
  }

  async delete(table: string, id: string): Promise<void> {
    const deleted = trialDelete(table, id);
    if (!deleted) {
      throw new Error(`Failed to delete from ${table} with id ${id}`);
    }
  }

  async count(table: string, filters?: QueryFilter[]): Promise<number> {
    const data = await this.get(table, filters);
    return data.length;
  }

  async batchInsert<T>(table: string, data: T[]): Promise<T[]> {
    const results: T[] = [];
    for (const item of data) {
      const inserted = await this.insert(table, item);
      results.push(inserted);
    }
    return results;
  }

  async batchUpdate<T>(table: string, updates: Array<{ id: string; data: Partial<T> }>): Promise<T[]> {
    const results: T[] = [];
    for (const { id, data } of updates) {
      const updated = await this.update(table, id, data);
      results.push(updated);
    }
    return results;
  }

  async batchDelete(table: string, ids: string[]): Promise<void> {
    for (const id of ids) {
      await this.delete(table, id);
    }
  }
}

// Supabase Adapter Implementation
class SupabaseAdapter implements DataAdapter {
  private buildQuery(table: string, filters?: QueryFilter[], sort?: SortOption) {
    let query = supabase.from(table as any).select("*");
    
    if (filters && filters.length > 0) {
      filters.forEach(filter => {
        switch (filter.operator) {
          case "eq":
            query = query.eq(filter.field, filter.value);
            break;
          case "neq":
            query = query.neq(filter.field, filter.value);
            break;
          case "gt":
            query = query.gt(filter.field, filter.value);
            break;
          case "gte":
            query = query.gte(filter.field, filter.value);
            break;
          case "lt":
            query = query.lt(filter.field, filter.value);
            break;
          case "lte":
            query = query.lte(filter.field, filter.value);
            break;
          case "like":
            query = query.like(filter.field, filter.value);
            break;
          case "in":
            query = query.in(filter.field, filter.value);
            break;
        }
      });
    }
    
    if (sort) {
      query = query.order(sort.field, { ascending: sort.ascending });
    }
    
    return query;
  }

  async get<T>(table: string, filters?: QueryFilter[], sort?: SortOption): Promise<T[]> {
    const query = this.buildQuery(table, filters, sort);
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Failed to get from ${table}: ${error.message}`);
    }
    
    return (data || []) as T[];
  }

  async getById<T>(table: string, id: string): Promise<T | null> {
    const { data, error } = await supabase.from(table as any).select("*").eq("id", id).single();
    
    if (error) {
      if (error.code === "PGRST116") {
        return null; // Not found
      }
      throw new Error(`Failed to get ${table} by id ${id}: ${error.message}`);
    }
    
    return data as T;
  }

  async insert<T>(table: string, data: T): Promise<T> {
    const { data: result, error } = await supabase.from(table as any).insert(data as any).select("*").single();
    
    if (error) {
      throw new Error(`Failed to insert into ${table}: ${error.message}`);
    }
    
    return result as T;
  }

  async update<T>(table: string, id: string, data: Partial<T>): Promise<T> {
    const { data: result, error } = await supabase.from(table as any).update(data as any).eq("id", id).select("*").single();
    
    if (error) {
      throw new Error(`Failed to update ${table} with id ${id}: ${error.message}`);
    }
    
    return result as T;
  }

  async delete(table: string, id: string): Promise<void> {
    const { error } = await supabase.from(table as any).delete().eq("id", id);
    
    if (error) {
      throw new Error(`Failed to delete from ${table} with id ${id}: ${error.message}`);
    }
  }

  async count(table: string, filters?: QueryFilter[]): Promise<number> {
    const query = this.buildQuery(table, filters);
    const { count, error } = await query;
    
    if (error) {
      throw new Error(`Failed to count ${table}: ${error.message}`);
    }
    
    return count || 0;
  }

  async batchInsert<T>(table: string, data: T[]): Promise<T[]> {
    const { data: result, error } = await supabase.from(table as any).insert(data as any).select("*");
    
    if (error) {
      throw new Error(`Failed to batch insert into ${table}: ${error.message}`);
    }
    
    return (result || []) as T[];
  }

  async batchUpdate<T>(table: string, updates: Array<{ id: string; data: Partial<T> }>): Promise<T[]> {
    // Supabase doesn't support batch updates in a single query
    // We'll need to do them sequentially
    const results: T[] = [];
    for (const { id, data } of updates) {
      const updated = await this.update(table, id, data);
      results.push(updated);
    }
    return results;
  }

  async batchDelete(table: string, ids: string[]): Promise<void> {
    const { error } = await supabase.from(table as any).delete().in("id", ids);
    
    if (error) {
      throw new Error(`Failed to batch delete from ${table}: ${error.message}`);
    }
  }
}

// Adapter Factory
let adapterInstance: DataAdapter | null = null;

export function getDataAdapter(): DataAdapter {
  if (!adapterInstance) {
    if (getTrialMode()) {
      adapterInstance = new LocalStorageAdapter();
    } else {
      adapterInstance = new SupabaseAdapter();
    }
  }
  return adapterInstance;
}

// Reset adapter instance (useful for testing or mode switching)
export function resetDataAdapter(): void {
  adapterInstance = null;
}
