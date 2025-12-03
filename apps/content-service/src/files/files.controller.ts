import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UploadedFile,
  UseInterceptors,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { FilesService } from './files.service';
import { UpdateFileDto } from './dto/update-file.dto';
import {
  FileResponseDto,
  FileUploadResponseDto,
} from './dto/file-response.dto';
import { ResponseDto } from '../common/dto/reponse.dto';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Files')
@Public()
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload file to MinIO and save metadata' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'File uploaded successfully',
    type: ResponseDto<FileUploadResponseDto>,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid file or request',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File upload',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File to upload',
        },
        customBucket: {
          type: 'string',
          description: 'Custom MinIO bucket name (optional)',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('customBucket') customBucket?: string,
  ): Promise<ResponseDto<FileUploadResponseDto>> {
    return this.filesService.uploadFile(file, customBucket);
  }

  @Get(':fileId')
  @ApiOperation({ summary: 'Get file by ID' })
  @ApiParam({ name: 'fileId' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'File retrieved successfully',
    type: ResponseDto<FileResponseDto>,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'File not found',
  })
  async getFileById(
    @Param('fileId') fileId: string,
  ): Promise<ResponseDto<FileResponseDto>> {
    return this.filesService.getFileById(fileId);
  }

  @Get(':fileId/download')
  @ApiOperation({ summary: 'Download file content' })
  @ApiParam({ name: 'fileId' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'File downloaded successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'File not found',
  })
  async downloadFile(
    @Param('fileId') fileId: string,
    @Res() res: Response,
  ): Promise<void> {
    const { buffer, fileName, contentType } =
      await this.filesService.downloadFile(fileId);

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': buffer.length.toString(),
    });

    res.send(buffer);
  }

  @Patch(':fileId')
  @ApiOperation({ summary: 'Update file metadata' })
  @ApiParam({ name: 'fileId' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'File updated successfully',
    type: ResponseDto<FileResponseDto>,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'File not found',
  })
  @ApiBody({ type: UpdateFileDto })
  async updateFile(
    @Param('fileId') fileId: string,
    @Body() updateFileDto: UpdateFileDto,
  ): Promise<ResponseDto<FileResponseDto>> {
    return this.filesService.updateFile(fileId, updateFileDto);
  }

  @Delete(':fileId')
  @ApiOperation({ summary: 'Soft delete file' })
  @ApiParam({ name: 'fileId' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'File deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'File not found',
  })
  async deleteFile(
    @Param('fileId') fileId: string,
    @Body('deletedBy') deletedBy?: string,
  ): Promise<ResponseDto<null>> {
    return this.filesService.deleteFile(fileId, deletedBy);
  }

  @Delete(':fileId/hard')
  @ApiOperation({ summary: 'Permanently delete file from MinIO and database' })
  @ApiParam({ name: 'fileId' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'File permanently deleted',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'File not found',
  })
  async hardDeleteFile(
    @Param('fileId') fileId: string,
  ): Promise<ResponseDto<null>> {
    return this.filesService.hardDeleteFile(fileId);
  }

  @Post(':fileId/restore')
  @ApiOperation({ summary: 'Restore soft deleted file' })
  @ApiParam({ name: 'fileId' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'File restored successfully',
    type: ResponseDto<FileResponseDto>,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'File not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'File is not deleted',
  })
  async restoreFile(
    @Param('fileId') fileId: string,
  ): Promise<ResponseDto<FileResponseDto>> {
    return this.filesService.restoreFile(fileId);
  }
}
