import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsIn, IsUrl } from 'class-validator';

// Validate request when creating content
export class CreateContentDto {
    @ApiProperty({ example: 'Introduction to Machine Learning' })
    @IsNotEmpty()
    @IsString()
    title: string;


    @ApiProperty({ required: false, example: 'This lesson covers...' })
    @IsOptional()
    @IsString()
    body?: string;


    @ApiProperty({ example: 'VIDEO', description: 'TEXT | VIDEO | IMAGE | PDF | QUIZ' })
    @IsNotEmpty()
    @IsString()
    @IsIn(['TEXT', 'VIDEO', 'IMAGE', 'PDF', 'QUIZ'])
    contentType: string;


    @ApiProperty({ required: false, example: 'https://cdn.example.com/video.mp4' })
    @IsOptional()
    @IsString()
    @IsUrl()
    resourceUrl?: string;
}