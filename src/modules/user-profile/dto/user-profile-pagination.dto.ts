export class UserProfilePaginationDto {
  id: number;
  age: number;
  height: number;
  weight: number;
  bmi: number;
  bmr: number;
  tdee: number;
  gender: string | null;
  activityLevel: string | null;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: number;
    email: string;
    fullName: string;
    avatarUrl: string | null;
  } | null;
}
