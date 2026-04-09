import { IsEnum, IsNotEmpty, IsInt, Min } from 'class-validator';

export enum VoteType {
  UPVOTE = 'upvote',
  DOWNVOTE = 'downvote',
}

export class VoteSubmissionDto {
  @IsEnum(VoteType, {
    message: 'Vote type phải là upvote hoặc downvote',
  })
  @IsNotEmpty({ message: 'Vote type không được để trống' })
  voteType: VoteType;
}
