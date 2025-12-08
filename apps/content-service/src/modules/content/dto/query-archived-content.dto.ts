import { OmitType } from '@nestjs/swagger';
import { QueryContentDto } from './query-content.dto';

// Dùng riêng cho route /content/archived: không cho chỉnh includeArchived
export class QueryArchivedContentDto extends OmitType(QueryContentDto, [
  'includeArchived',
] as const) {}
