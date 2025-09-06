import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { CloudinaryService } from './cloudinary.service';
import { UploadApiResponse } from 'cloudinary';
import { PrismaService } from 'src/database/prisma.service';
import { Lesson, LessonType } from '@prisma/client';
import { unlink } from 'fs';
import { IMaterial } from 'src/helper/interfaces/interfaces.response';
import { matrialType } from 'src/decorator/enums/roles';

@Injectable()
export class LessonService {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly prisma: PrismaService
  ) { }
  async create(file: Express.Multer.File, CreateLessonDto: CreateLessonDto, subjectId: number, groupId: number, userId: number): Promise<Lesson> {

    if (!subjectId) {
      throw new BadRequestException('subjectId is required');
    }
    if (!file) {
      throw new BadRequestException('File is required');
    }
    let subject = await this.prisma.subject.findUnique({
      where: {
        id: subjectId,
        teacherId: userId
      }
    });
    if (!subject) {
      throw new BadRequestException('Subject not found');
    }
    let group = await this.prisma.group.findUnique({
      where: {
        id: groupId
      }
    });
    if (!group) throw new BadRequestException("Group not found");


    const result: UploadApiResponse = await this.cloudinaryService.uploadFile(file).catch((err) => {
      console.log(err);
      throw new BadRequestException('Error uploading file');
    });

    // await unlink(file.path , (err) => {
    //   console.log(file.path);
    //   if (err) {
    //     console.error('Error deleting file:', err);
    //   } else {
    //     console.log('File deleted successfully');
    //   }
    // });
    let type: string;
    switch (file.mimetype) {
      case 'video/mp4':
        type = matrialType.video as string;
        break;
      case 'application/pdf':
        type = matrialType.pdf as string;
        break;
      default:
        type = matrialType.document as string;
    }

    let lesson = await this.prisma.lesson.create({
      data: {
        title: CreateLessonDto.title,
        url: result.secure_url,
        type: type,
        subjectId: subjectId,
        publicId: result.public_id,
        groupId: groupId

      }
    });
    return lesson;
  }

  async findAllForSubject(subjectId: number): Promise<IMaterial[]> {

    let lessons = await this.prisma.lesson.findMany({
      where: {
        subjectId: subjectId
      },
      include: {
        subject: {
          select: {
            title: true,
            description: true,
            teacher: { select: { name: true, email: true, id: true } }


          }
        }
      }
    });
    return lessons.map((lesson) => ({
      id: lesson.id.toString(),
      name: lesson.subject.title,
      fileUrl: lesson.url,
      type: lesson.type,
      subjectId: lesson.subjectId.toString(),
      description: lesson.title,
      createdAt: lesson.createdAt,
      createdBy: {
        id: lesson.subject.teacher.id.toString(),
        name: lesson.subject.teacher.name,
        email: lesson.subject.teacher.email,
      },
      groupId: lesson.groupId.toString()
    }));
  }

  async findOne(id: number): Promise<IMaterial> {
    let lesson = await this.prisma.lesson.findUnique({
      where: {
        id: id
      },
      include: {
        subject: {
          select: {
            title: true,
            description: true,
            teacher: { select: { name: true, email: true, id: true } }
          }
        }
      }
    });
    if (!lesson) {
      throw new BadRequestException('Lesson not found');
    }
    return {
      id: lesson.id.toString(),
      name: lesson.subject.title,
      fileUrl: lesson.url,
      type: lesson.type,
      groupId: lesson.groupId.toString(),
      subjectId: lesson.subjectId.toString(),
      description: lesson.title,
      createdAt: lesson.createdAt,
      createdBy: {
        id: lesson.subject.teacher.id.toString(),
        name: lesson.subject.teacher.name,
        email: lesson.subject.teacher.email,

      }
    };
  }


  async getalllessonsforteacher(teacherId: number): Promise<IMaterial[]> {
    let lessons = await this.prisma.lesson.findMany({
      where: {
        subject: {
          teacherId: teacherId
        },


      },

      include: {
        subject: {
          select: {
            title: true,
            description: true,
            teacher: { select: { name: true, email: true, id: true } }
          }
        }
      }
    });
    if  (!lessons) {
      throw new BadRequestException('Lessons not found');
    }
    return lessons.map((lesson) => ({
      id: lesson.id.toString(),
      name: lesson.subject.title,
      fileUrl: lesson.url,
      type: lesson.type,
      subjectId: lesson.subjectId.toString(),
      description: lesson.title,
      createdAt: lesson.createdAt,
      createdBy: {
        id: lesson.subject.teacher.id.toString(),
        name: lesson.subject.teacher.name,
        email: lesson.subject.teacher.email,
      },
      groupId: lesson.groupId.toString()
    }));
  }

  update(id: number, updateLessonDto: UpdateLessonDto) {
    return `This action updates a #${id} lesson`;
  }

  async remove(id: number) {
    let lesson = await this.prisma.lesson.findUnique({
      where: {
        id: id
      }
    });
    if (!lesson) {
      throw new BadRequestException('Lesson not found');
    }
    await this.prisma.lesson.delete({
      where: {
        id: id
      }
    });
    this.cloudinaryService.deleteFile(lesson.publicId);
    return { message: 'Lesson deleted successfully' };
  }
}
