import { create } from "zustand";

import {
  ProductField,
  createProductField,
  deleteProductField,
  getProductFields,
  reorderProductFields,
  updateProductField,
  type ProductFieldInput,
  type ProductFieldUpdate,
} from "@/lib/api/product-fields";

interface ProductFieldsStore {
  fields: ProductField[];
  standard: ProductField[];
  loaded: boolean;
  loading: boolean;
  error: string | null;
  fetch: (force?: boolean) => Promise<void>;
  create: (input: ProductFieldInput) => Promise<ProductField | null>;
  update: (id: number, patch: ProductFieldUpdate) => Promise<ProductField | null>;
  remove: (id: number) => Promise<boolean>;
  reorder: (items: Array<{ id: number; display_order: number }>) => Promise<boolean>;
  invalidate: () => void;
}

export const useProductFieldsStore = create<ProductFieldsStore>((set, get) => ({
  fields: [],
  standard: [],
  loaded: false,
  loading: false,
  error: null,

  fetch: async (force = false) => {
    const state = get();
    if (!force && (state.loaded || state.loading)) return;

    set({ loading: true, error: null });
    try {
      const response = await getProductFields();
      set({
        fields: response.data,
        standard: (response.standard ?? []) as unknown as ProductField[],
        loaded: true,
        loading: false,
      });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : "Error",
      });
    }
  },

  create: async (input) => {
    try {
      const field = await createProductField(input);
      set((state) => ({ fields: [...state.fields, field], error: null }));
      return field;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Error" });
      return null;
    }
  },

  update: async (id, patch) => {
    try {
      const updated = await updateProductField(id, patch);
      set((state) => ({
        fields: state.fields.map((f) => (f.id === id ? updated : f)),
        error: null,
      }));
      return updated;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Error" });
      return null;
    }
  },

  remove: async (id) => {
    try {
      await deleteProductField(id);
      set((state) => ({ fields: state.fields.filter((f) => f.id !== id), error: null }));
      return true;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Error" });
      return false;
    }
  },

  reorder: async (items) => {
    try {
      await reorderProductFields(items);
      set((state) => ({
        fields: [...state.fields]
          .map((f) => {
            const item = items.find((i) => i.id === f.id);
            return item ? { ...f, display_order: item.display_order } : f;
          })
          .sort((a, b) => a.display_order - b.display_order),
        error: null,
      }));
      return true;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Error" });
      return false;
    }
  },

  invalidate: () => set({ loaded: false }),
}));
