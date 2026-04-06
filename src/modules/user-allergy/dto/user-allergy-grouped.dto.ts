export class UserAllergyGroupedDto {
  userId: number;
  user: {
    id: number;
    email: string;
    fullName: string;
    avatarUrl: string | null;
  } | null;
  allergies: {
    id: number;
    severity: string;
    severityInfo?: {
      keyMap: string;
      value: string;
      description: string | null;
      type: string;
    } | null;
    note: string | null;
    allergenId: number;
    allergen: {
      id: number;
      name: string;
      description: string | null;
    } | null;
    createdAt: Date;
    updatedAt: Date;
  }[];
}
