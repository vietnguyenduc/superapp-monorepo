import type { Database as BaseDatabase } from "@repo/types";

type GenericRelationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

type GenericTable = {
  Row: Record<string, unknown>;
  Insert: Record<string, unknown>;
  Update: Record<string, unknown>;
  Relationships: GenericRelationship[];
};

type GenericView = GenericTable;

type GenericFunction = {
  Args: Record<string, unknown> | never;
  Returns: unknown;
};

export type FrameworkDatabase = BaseDatabase & {
  public: {
    Tables: BaseDatabase["public"]["Tables"] & Record<string, GenericTable>;
    Views: BaseDatabase["public"]["Views"] & Record<string, GenericView>;
    Functions: BaseDatabase["public"]["Functions"] & Record<string, GenericFunction>;
    Enums: BaseDatabase["public"]["Enums"];
    CompositeTypes: BaseDatabase["public"]["CompositeTypes"];
  };
};
