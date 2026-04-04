import { Exclude } from 'class-transformer';

export class UserPaginationDto {
  id: number;
  email: string;

  @Exclude()
  password: string;

  @Exclude()
  accessToken: string;

  @Exclude()
  refreshToken: string;

  avatarUrl: string | null;
  fullName: string;
  dateOfBirth: Date | null;
  isAdmin: boolean;
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
  userProfile: {
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
  } | null;
}
