import { Module } from '@nestjs/common';
import { GroupService } from './group.service';
import { GroupController } from './group.controller';
import { PrismaService } from 'src/database/prisma.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [GroupController],
  providers: [GroupService, PrismaService],
  imports: [AuthModule],
})
export class GroupModule { }
