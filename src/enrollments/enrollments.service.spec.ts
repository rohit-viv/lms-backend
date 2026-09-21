import { Types } from 'mongoose';
import { EnrollmentsService } from './enrollments.service';

describe('EnrollmentsService', () => {
  it('marks a course completed when the last lesson is finished', async () => {
    const save = jest.fn().mockResolvedValue(null);
    const lessonId = new Types.ObjectId();
    const courseId = new Types.ObjectId();
    const enrollment = {
      completedLessons: [
        {
          toString: () =>
            '507f1f77bcf86cd799439011',
        },
      ],
      progress: 50,
      status: 'active',
      save,
    };

    const service = new EnrollmentsService(
      {
        findOne: jest
          .fn()
          .mockResolvedValue(enrollment),
      } as never,
      {
        findById: jest
          .fn()
          .mockResolvedValue({
            title: 'NestJS',
          }),
      } as never,
      {
        findOne: jest
          .fn()
          .mockResolvedValue({
            _id: lessonId,
            course: courseId,
          }),
        countDocuments: jest
          .fn()
          .mockResolvedValue(2),
      } as never,
      {
        emit: jest.fn(),
      } as never,
      {
        emit: jest.fn(),
      } as never,
    );

    const result = await service.completeLesson(
      courseId.toString(),
      lessonId.toString(),
      'student-1',
    );

    expect(result.progress).toBe(100);
    expect(result.status).toBe('completed');
    expect(save).toHaveBeenCalled();
  });
});
