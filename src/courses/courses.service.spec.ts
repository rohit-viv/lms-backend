import { ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';
import { CoursesService } from './courses.service';
import { Role } from '../common/enums/role.enum';

describe('CoursesService', () => {
  it('publishes a course for its instructor', async () => {
    const save = jest.fn().mockResolvedValue(null);
    const course = {
      instructor: new Types.ObjectId(),
      status: 'draft',
      save,
    };

    const service = new CoursesService(
      {
        findById: jest
          .fn()
          .mockResolvedValue(course),
      } as never,
      {} as never,
    );

    const result = await service.publish(
      'course-id',
      {
        sub: course.instructor.toString(),
        role: Role.INSTRUCTOR,
      },
    );

    expect(result.message).toContain(
      'published',
    );
    expect(course.status).toBe('published');
    expect(save).toHaveBeenCalled();
  });

  it('blocks another instructor from publishing a course', async () => {
    const service = new CoursesService(
      {
        findById: jest.fn().mockResolvedValue({
          instructor: new Types.ObjectId(),
        }),
      } as never,
      {} as never,
    );

    await expect(
      service.publish('course-id', {
        sub: new Types.ObjectId().toString(),
        role: Role.INSTRUCTOR,
      }),
    ).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
