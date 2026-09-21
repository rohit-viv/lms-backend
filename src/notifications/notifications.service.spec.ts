import { NotificationsService } from './notifications.service';
import { StudentEnrolledEvent } from '../enrollments/events/student-enrolled.event';

describe('NotificationsService', () => {
  it('stores and pushes a notification when a student enrolls', async () => {
    const notification = {
      _id: 'notification-1',
      title: 'Enrollment successful',
    };

    const notificationModel = {
      create: jest
        .fn()
        .mockResolvedValue(notification),
    };

    const gateway = {
      sendNotification: jest.fn(),
    };

    const service = new NotificationsService(
      notificationModel as never,
      gateway as never,
    );

    await service.handleStudentEnrolled(
      new StudentEnrolledEvent(
        '507f1f77bcf86cd799439011',
        'course-1',
        'NestJS Mastery',
      ),
    );

    expect(
      notificationModel.create,
    ).toHaveBeenCalled();
    expect(
      gateway.sendNotification,
    ).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
      notification,
    );
  });
});
