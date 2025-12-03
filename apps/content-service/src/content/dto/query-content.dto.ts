import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBooleanString } from 'class-validator';

//Validate query params when retrieving content list

export class QueryContentDto {
    // filter by type
    @ApiPropertyOptional({ description: 'Filter by content type', example: 'VIDEO' })
    @IsOptional()
    @IsString()
    type?: string;


    @ApiPropertyOptional({ description: 'Include archived content (true/false)', example: 'false' })
    @IsOptional()
    @IsBooleanString()
    includeArchived?: string;


    @ApiPropertyOptional({ description: 'Search in title', example: 'machine' })
    @IsOptional()
    @IsString()
    search?: string;
}