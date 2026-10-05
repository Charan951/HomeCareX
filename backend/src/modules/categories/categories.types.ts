export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  sortOrder: number;
  active: boolean;
  /** Number of services in this category. */
  services: number;
}
