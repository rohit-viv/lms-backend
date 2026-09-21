import { ApiProperty } from '@nestjs/swagger';
import {
    IsEmail,
    IsNotEmpty,
    IsString,
    MinLength,
} from 'class-validator';

export class RegisterDto {
    @ApiProperty({
        example: 'Rohit Kumar',
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        example: 'rohit@gmail.com',
    })
    @IsEmail()
    email: string;

    @ApiProperty({
        example: '123456',
        minLength: 6,
    })
    @IsString()
    @MinLength(6)
    password: string;
}