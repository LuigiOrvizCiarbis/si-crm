import { create } from "zustand";

import {
  ContactField,
  createContactField,
  deleteContactField,
  getContactFields,
  reorderContactFields,
  updateContactField,
  type ContactFieldInput,
  type ContactFieldUpdate,
} from "@/lib/api/contact-fields";

interface ContactFieldsStore {
  fields: ContactField[];
  standard: ContactField[];
  loaded: boolean;
  loading: boolean;
  error: string | null;
  fetch: (force?: boolean) => Promise<void>;
  create: (input: ContactFieldInput) => Promise<ContactField | null>;
  update: (id: number, patch: ContactFieldUpdate) => Promise<ContactField | null>;
  remove: (id: number) => Promise<boolean>;
  reorder: (items: Array<{ id: number; display_order: number }>) => Promise<boolean>;
  invalidate: () => void;
}

export const useContactFieldsStore = create<ContactFieldsStore>((set, get) => ({
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
      const response = await getContactFields();
      set({
        fields: response.data,
        standard: (response.standard ?? []) as unknown as ContactField[],
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
      const field = await createContactField(input);
      set((state) => ({ fields: [...state.fields, field] }));
      return field;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Error" });
      return null;
    }
  },

  update: async (id, patch) => {
    try {
      const updated = await updateContactField(id, patch);
      set((state) => ({
        fields: state.fields.map((f) => (f.id === id ? updated : f)),
      }));
      return updated;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Error" });
      return null;
    }
  },

  remove: async (id) => {
    try {
      await deleteContactField(id);
      set((state) => ({ fields: state.fields.filter((f) => f.id !== id) }));
      return true;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Error" });
      return false;
    }
  },

  reorder: async (items) => {
    try {
      await reorderContactFields(items);
      set((state) => ({
        fields: [...state.fields]
          .map((f) => {
            const item = items.find((i) => i.id === f.id);
            return item ? { ...f, display_order: item.display_order } : f;
          })
          .sort((a, b) => a.display_order - b.display_order),
      }));
      return true;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Error" });
      return false;
    }
  },

  invalidate: () => set({ loaded: false }),
}));
