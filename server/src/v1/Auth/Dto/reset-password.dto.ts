import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Matches, Length } from 'class-validator';

export class ResetPasswordDto {
    @ApiProperty({
        required: true,
        example: 'demo@demo.com',
    })
    @Matches(/^\\w+([\\.-]?\\w+)*@\\w+([\\.-]?\\w+)*(\\.\\w{2,3})+$/, {
        message: 'Email must be a type of email'
    })
    email: string;

    @ApiProperty({
        required: true,
        example: 'newpassword123',
    })
    @IsNotEmpty()
    @Length(6, 100)
    newPassword: string;

    @ApiProperty({
        required: true,
        example: 'resetToken123',
    })
    @IsNotEmpty()
    token: string;
}
