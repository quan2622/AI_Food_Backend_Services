export class UserAllergyPaginationDto {
  id: number;
  severity: string;
  note: string | null;
  userId: number;
  allergenId: number;
  allergen: {
    id: number;
    name: string;
    description: string | null;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}
