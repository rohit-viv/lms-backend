import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OnEvent } from '@nestjs/event-emitter';

import {
    Notification,
    NotificationDocument,
} from './schemas/notification.schema';

import { StudentEnrolledEvent } from '../enrollments/events/student-enrolled.event';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectModel(Notification.name)
        private readonly notificationModel: Model<NotificationDocument>,
        private readonly notificationsGateway: NotificationsGateway,
    ) { }

    @OnEvent('student.enrolled')
    async handleStudentEnrolled(
        event: StudentEnrolledEvent,
    ) {
        const notification =
            await this.notificationModel.create({
            user: new Types.ObjectId(event.studentId),
            title: 'Enrollment successful',
            message: `You enrolled in ${event.courseTitle}`,
        });

        this.notificationsGateway.sendNotification(
            event.studentId,
            notification,
        );
    }

    async findMyNotifications(userId: string) {
        return this.notificationModel
            .find({ user: userId })
            .sort({ createdAt: -1 })
            .exec();
    }

    async markAsRead(
        notificationId: string,
        userId: string,
    ) {
        if (!Types.ObjectId.isValid(notificationId)) {

            throw new BadRequestException('Invalid notification id');
        }

        const notification =
            await this.notificationModel.findOneAndUpdate(
                {
                    _id: notificationId,
                    user: userId,
                },
                {
                    isRead: true,
                },
                {
                    new: true,
                },
            );

        if (!notification) {
            throw new NotFoundException(
                'Notification not found',
            );
        }

        return notification;
    }
}
