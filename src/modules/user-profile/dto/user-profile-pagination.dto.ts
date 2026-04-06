export class UserProfilePaginationDto {
  id: number;
  age: number;
  height: number;
  weight: number;
  bmi: number;
  bmr: number;
  tdee: number;
  gender: string | null;
  genderData: {
    keyMap: string;
    type: string;
    value: string;
    description: string | null;
  } | null;
  activityLevel: string | null;
  activityLevelData: {
    keyMap: string;
    type: string;
    value: string;
    description: string | null;
  } | null;
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
