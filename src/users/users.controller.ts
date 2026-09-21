import {
    Body,
    Controller,
    Get,
    Post,
    Param,
    Patch,
    Query,
    UseGuards,
    UploadedFile,
    UseInterceptors,
    FileTypeValidator,
    MaxFileSizeValidator,
    ParseFilePipe,
} from '@nestjs/common';

import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { UserQueryDto } from './dto/user-query.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
    ) { }

    @Get('me')
    getMyProfile(
        @CurrentUser() user: any,
    ) {
        return this.usersService.findMyProfile(
            user.sub,
        );
    }

    @Patch('me')
    updateMyProfile(
        @CurrentUser() user: any,
        @Body() updateProfileDto: UpdateProfileDto,
    ) {
        return this.usersService.updateMyProfile(
            user.sub,
            updateProfileDto,
        );
    }

    @Get()
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    findAll(
        @Query() query: UserQueryDto,
    ) {
        return this.usersService.findAll(query);
    }

    @Patch(':id/role')
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    updateRole(
        @Param('id', ParseObjectIdPipe) id: string,
        @Body() body: UpdateRoleDto,
    ) {
        return this.usersService.updateRole(
            id,
            body.role,
        );
    }

    @Post('me/avatar')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: './uploads/avatars',

                filename: (req, file, callback) => {
                    const uniqueName =
                        `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

                    callback(
                        null,
                        `${uniqueName}${extname(file.originalname)}`,
                    );
                },
            }),
        }),
    )
    uploadAvatar(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({
                        maxSize: 2 * 1024 * 1024,
                    }),
                    new FileTypeValidator({
                        fileType: /(jpg|jpeg|png|webp)$/,
                    }),
                ],
            }),
        )
        file: Express.Multer.File,

        @CurrentUser() user: any,
    ) {
        return this.usersService.updateAvatar(
            user.sub,
            file.filename,
        );
    }
}