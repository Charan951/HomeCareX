/** Admin catalog types. Extends the flat backend CategoryDto with tree + gallery fields. */

export interface CategoryImage {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
}

export interface AdminCategory {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string;
  /** Emoji or short text icon (backend allows up to 8 chars). */
  icon: string;
  /** Uploaded icon image (data/remote URL); wins over the emoji when set. */
  iconUrl?: string;
  images: CategoryImage[];
  sortOrder: number;
  active: boolean;
  /** Services directly in this category. */
  services: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryInput {
  name: string;
  slug: string;
  parentId: string | null;
  description: string;
  icon: string;
  iconUrl?: string;
  images: CategoryImage[];
  active: boolean;
}

export interface CategoryAuditEntry {
  id: string;
  actor: string;
  action: 'create' | 'update' | 'activate' | 'deactivate' | 'delete' | 'reorder' | 'move';
  entityId: string;
  entityName: string;
  time: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}

export interface ReorderItem {
  id: string;
  parentId: string | null;
  sortOrder: number;
}

export type StatusFilter = 'all' | 'active' | 'inactive';
export type LevelFilter = 'all' | 'parent' | 'sub';
export type ServicesFilter = 'all' | 'with' | 'without';
export type SortKey = 'manual' | 'name-asc' | 'name-desc' | 'services-desc' | 'newest';

export interface CategoryFilters {
  status: StatusFilter;
  level: LevelFilter;
  services: ServicesFilter;
  hasImages: boolean;
  sort: SortKey;
}

export const DEFAULT_FILTERS: CategoryFilters = {
  status: 'all', level: 'all', services: 'all', hasImages: false, sort: 'manual',
};
