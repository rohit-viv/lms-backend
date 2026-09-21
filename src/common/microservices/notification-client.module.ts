import { Module } from '@nestjs/common';
import {
  ClientsModule,
  Transport,
} from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NOTIFICATION_SERVICE',

        transport: Transport.TCP,

        options: {
          host: '127.0.0.1',
          port: 4002,
        },
      },
    ]),
  ],

  exports: [ClientsModule],
})
export class NotificationClientModule {}