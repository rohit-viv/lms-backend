import {
    ConnectedSocket,
    OnGatewayConnection,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';

import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
    cors: {
        origin: true,
        credentials: true,
    },
})
export class NotificationsGateway
    implements OnGatewayConnection {
    @WebSocketServer()
    server: Server;

    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) { }

    async handleConnection(client: Socket) {
        try {
            const token =
                client.handshake.auth?.token ||
                client.handshake.headers.authorization
                    ?.replace('Bearer ', '');

            if (!token) {
                client.disconnect();
                return;
            }

            const payload =
                await this.jwtService.verifyAsync(token, {
                    secret:
                        this.configService.get<string>(
                            'JWT_SECRET',
                        ),
                });

            const userId = payload.sub;

            client.data.user = payload;

            await client.join(userId);

            console.log(
                `Socket connected for user: ${userId}`,
            );
        } catch {
            client.disconnect();
        }
    }

    sendNotification(
        userId: string,
        notification: any,
    ) {
        this.server
            .to(userId)
            .emit('notification', notification);
    }
}