import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { PrismaService } from 'src/database/prisma.service';
import { Group } from '@prisma/client';
import { IGroup } from 'src/helper/interfaces/interfaces.response';

@Injectable()
export class GroupService {
  constructor(private prisma: PrismaService) { }
  async create(createGroupDto: CreateGroupDto, subjectId: number, userId: number): Promise<Group> {
    let subject = await this.prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) throw new BadRequestException("Subject not found");
    let group = await this.prisma.group.create({
      data: {
        name: createGroupDto.name,
        capacity: createGroupDto.capacity,
        subjectId: subjectId,
        createdById: userId
      },
    });
    return group;
  }

  async completeGroup(groupId: number, userId: number) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new BadRequestException("Group not found");

    if (group.createdById !== userId) {
      throw new BadRequestException("Only the creator can complete this group");
    }

    if (group.status === 'COMPLETED') {
      throw new BadRequestException("Group already completed");
    }

    return this.prisma.group.update({
      where: { id: groupId },
      data: { status: 'COMPLETED' },
    });
  }

  async checkAndUpdateStatus(groupId: number) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        memberships: { where: { status: 'APPROVED' } },
      },
    });

    if (!group) throw new BadRequestException("Group not found");

    // Auto mark as completed if membership count == capacity
    if (group.memberships.length >= group.capacity && group.status !== 'COMPLETED') {
      await this.prisma.group.update({
        where: { id: groupId },
        data: { status: 'COMPLETED' },
      });
    }
  }


  async findAllBySubject(subjectId: number): Promise<IGroup[]> {
    let subject = await this.prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) throw new BadRequestException("Subject not found");
    let groups = await this.prisma.group.findMany({
      where: { subjectId: subjectId },
      include: {
        memberships: {
          select: {
            student: {
              select: { id: true, name: true, email: true },
            },
          },
          where: { status: 'APPROVED' },
        },
        subject: {
          select: {
            id: true,
            title: true,
            description: true,

          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },

      },



    });
    return groups.map(
      (group) => {
        return {
          id: group.id.toString(),
          name: group.name,
          teacherId: group.createdById.toString(),
          subjectId: group.subject.id.toString(),
          capacity: group.capacity.toString(),
          studentIds: group.memberships.map(m => m.student.id.toString()),
          status: group.status === 'COMPLETED' ? 'completed' : 'not',
          createdAt: group.createdAt,
        };
      }
    );
  }

  async findOne(id: number): Promise<IGroup> {
    let group = await this.prisma.group.findUnique({
      where: { id: id }, include: {
        subject: {
          select: {
            id: true,
            title: true,
            description: true,
            teacher: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        memberships: {
          select: {
            id: true,
            student: {
              select: { id: true, name: true, email: true },
            },
          },
          where: { status: 'APPROVED' },
        },
      }
    });
    if (!group) throw new BadRequestException("Group not found");
    return {
      id: group.id.toString(),
      name: group.name,
      teacherId: group.subject.teacher.id.toString(),
      subjectId: group.subject.id.toString(),
      capacity: group.capacity.toString(),
      studentIds: group.memberships.map(m => m.student.id.toString()),
      status: group.status === 'COMPLETED' ? 'completed' : 'not',
      createdAt: group.createdAt,

    };
  }

  async update(id: number, updateGroupDto: UpdateGroupDto, userId: number): Promise<Group> {

    let group = await this.prisma.group.findUnique({ where: { id: id, createdById: userId } });
    if (!group) throw new BadRequestException("Group not found");

    let updatedGroup = await this.prisma.group.update({
      where: { id: id },
      data: {
        name: updateGroupDto.name,
      },
    });
    return updatedGroup;

  }

  async remove(id: number, userId: number) {
    let group = await this.prisma.group.findUnique({ where: { id: id, createdById: userId } });
    if (!group) throw new BadRequestException("Group not found");
    await this.prisma.group.delete({ where: { id: id } });
    return { message: "Group deleted successfully" };
  }
}
