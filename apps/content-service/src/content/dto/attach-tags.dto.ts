import { IsArray, ArrayNotEmpty, ArrayUnique, IsString } from 'class-validator';

export class AttachTagsDto {
    @IsArray()
    @ArrayNotEmpty()
    @ArrayUnique()
    @IsString({ each: true })
    tags!: string[];
}