import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile, BadRequestException, Query, ParseIntPipe, UseGuards, Req } from '@nestjs/common';
import { LessonService } from './lesson.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import * as multer from 'multer';
import { diskStorage, memoryStorage } from 'multer';

import { FileInterceptor } from '@nestjs/platform-express'
import { AuthenticationGuard } from 'src/guards/authentication.guard';
import { AuthorizationGuard } from 'src/guards/authorization.guard';
import { Roles } from 'src/decorator/decorator/roles.decorator';
import { Role } from 'src/decorator/enums/roles';
@Controller('lesson')
export class LessonController {
  constructor(private readonly lessonService: LessonService) {}

  @Post('create')
  @Roles(Role.TEACHER)
  @UseGuards(AuthenticationGuard,AuthorizationGuard)
  @UseInterceptors(
    FileInterceptor('file'  , {
      storage: memoryStorage(),

      fileFilter: (req, file, cb) => {
        if (!file) {
          return cb(new BadRequestException('File is required'), false);
        }
        cb(null, true);
      }
    }),
  )
  
  /**
   * Creates a new lesson in the given group and subject for the current user
   * @param file The file to upload to the lesson
   * @param subjectId The id of the subject that this lesson belongs to
   * @param groupId The id of the group that this lesson belongs to
   * @param CreateLessonDto The lesson data to create
   * @returns The created lesson object
   */
  create(@UploadedFile() file: Express.Multer.File, @Query('subjectId') subjectId: string ,@Query('groupId') groupId: string,@Body() CreateLessonDto : CreateLessonDto , @Req() req: any) {
    return this.lessonService.create(file , CreateLessonDto , +subjectId , +groupId , req.user.id);
  }

  @Get('for-subject/:subjectId')
  /**
   * Retrieves all lessons for the given subject id
   * @param subjectId the id of the subject to find lessons for
   * @returns an array of lesson objects
   */
  findAllForSubject(@Param('subjectId', ParseIntPipe) subjectId: number) {
    return this.lessonService.findAllForSubject(subjectId);
  }

  @Get('for-teacher/:teacherId')
  /**
   * Retrieves all lessons for the given subject id
   * @param subjectId the id of the subject to find lessons for
   * @returns an array of lesson objects
   */
  findAllForteacher(@Param('teacherId', ParseIntPipe) teacherId: number) {
    return this.lessonService.getalllessonsforteacher(teacherId);
  }

  @Get(':id')
  /**
   * Retrieves a single lesson by its id
   * @param id the id of the lesson to retrieve
   * @returns the lesson object
   */
  findOne(@Param('id') id: string) {
    return this.lessonService.findOne(+id);
  }

  @Delete(':id')
  @Roles(Role.TEACHER)
  @UseGuards(AuthenticationGuard,AuthorizationGuard)
  /**
   * Deletes a lesson by its id
   * @param id the id of the lesson to delete
   * @returns a message indicating the lesson was deleted successfully
   */
  remove(@Param('id') id: string) {
    return this.lessonService.remove(+id);
  }
}
