import { create } from "zustand";

import {
  Branch,
  BranchPayload,
  createBranch,
  deleteBranch,
  getBranches,
  updateBranch,
} from "@/lib/api/branches";

interface BranchesStore {
  branches: Branch[];
  loaded: boolean;
  loading: boolean;
  error: string | null;
  fetch: (force?: boolean) => Promise<void>;
  create: (input: BranchPayload) => Promise<Branch | null>;
  update: (id: number, patch: BranchPayload) => Promise<Branch | null>;
  remove: (id: number) => Promise<{ ok: boolean; error?: string }>;
  invalidate: () => void;
}

export const useBranchesStore = create<BranchesStore>((set, get) => ({
  branches: [],
  loaded: false,
  loading: false,
  error: null,

  fetch: async (force = false) => {
    const state = get();
    if (!force && (state.loaded || state.loading)) return;

    set({ loading: true, error: null });
    const branches = await getBranches();
    set({ branches, loaded: true, loading: false });
  },

  create: async (input) => {
    const { data, error } = await createBranch(input);
    if (error || !data) {
      set({ error: error || "Error" });
      return null;
    }
    set((state) => ({ branches: [...state.branches, data].sort((a, b) => a.name.localeCompare(b.name)) }));
    return data;
  },

  update: async (id, patch) => {
    const { data, error } = await updateBranch(id, patch);
    if (error || !data) {
      set({ error: error || "Error" });
      return null;
    }
    set((state) => ({
      branches: state.branches.map((b) => (b.id === id ? data : b)),
    }));
    return data;
  },

  remove: async (id) => {
    const { error } = await deleteBranch(id);
    if (error) {
      set({ error });
      return { ok: false, error };
    }
    set((state) => ({ branches: state.branches.filter((b) => b.id !== id) }));
    return { ok: true };
  },

  invalidate: () => set({ loaded: false }),
}));

export const isBranchFeatureActive = (state: BranchesStore): boolean => state.branches.length > 0;
