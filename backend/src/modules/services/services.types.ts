export interface ServiceDto {
  id: string;
  slug: string;
  name: string;
  description: string;
  categoryId: string;
  category: { id: string; name: string; slug: string } | null;
  basePrice: number;
  durationMinutes: number;
  addOns: { id: string; name: string; price: number }[];
  active: boolean;
}
