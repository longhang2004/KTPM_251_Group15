import { PartialType } from '@nestjs/swagger';
import { CreateContentDto } from './create-content.dto';

// Validate data when update content.
export class UpdateContentDto extends PartialType(CreateContentDto) { }