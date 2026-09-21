import {
    Inject,
    Injectable,
} from '@nestjs/common';

import {
    ClientProxy,
} from '@nestjs/microservices';

@Injectable()
export class DemoService {
    constructor(
        @Inject('NOTIFICATION_SERVICE')
        private readonly notificationClient: ClientProxy,
    ) { }

    getNotification() {
        return this.notificationClient.send(
            'get_notification',
            {
                userId: '123',
                message: 'Hello from LMS',
            },
        );
    }

    sendEnrollmentEvent() {
        this.notificationClient.emit(
            'student_enrolled',
            {
                studentId: '123',
                courseId: '456',
                courseTitle: 'NestJS Complete Course',
            },
        );

        return {
            message: 'Enrollment event sent',
        };
    }
}