import { Test, TestingModule } from '@nestjs/testing';
import { WorkoutLogController } from './workout-log.controller';

describe('WorkoutLogController', () => {
  let controller: WorkoutLogController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkoutLogController],
    }).compile();

    controller = module.get<WorkoutLogController>(WorkoutLogController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
