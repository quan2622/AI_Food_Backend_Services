import { Test, TestingModule } from '@nestjs/testing';
import { WorkoutLogService } from './workout-log.service';

describe('WorkoutLogService', () => {
  let service: WorkoutLogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WorkoutLogService],
    }).compile();

    service = module.get<WorkoutLogService>(WorkoutLogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
