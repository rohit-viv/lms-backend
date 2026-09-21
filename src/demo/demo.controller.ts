import { Controller, Get,Post } from '@nestjs/common';
import { DemoService } from './demo.service';

@Controller('demo')
export class DemoController {
    constructor(
        private readonly demoService: DemoService,
    ) { }

    @Get('notification')
    getNotification() {
        return this.demoService.getNotification();
    }

    @Post('enrollment')
    sendEnrollmentEvent() {
        return this.demoService.sendEnrollmentEvent();
    }
}