import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsPhoneNumber, Length } from 'class-validator';

export class GenerateOtpDto {
    @ApiProperty({
        required: true,
        example: '+1234567890',
    })
    @IsPhoneNumber()
    phoneNumber: string;
}

export class ValidateOtpDto {
    @ApiProperty({
        required: true,
        example: '+1234567890',
    })
    @IsPhoneNumber()
    phoneNumber: string;

    @ApiProperty({
        required: true,
        example: '123456',
    })
    @IsNotEmpty()
    @Length(6, 6)
    otpCode: string;
}
