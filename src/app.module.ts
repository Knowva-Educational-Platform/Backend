import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { MailModule } from './mail/mail.module';
import { SubjectModule } from './subject/subject.module';
import { GroupModule } from './group/group.module';
import { QuizModule } from './quiz/quiz.module';
import { EnrollmentModule } from './enrollment/enrollment.module';
import { LessonModule } from './lesson/lesson.module';
import { NotificationModule } from './notification/notification.module';
import { ChatModule } from './chat/chat.module';
// import { GroupChatModule } from './group-chat/group-chat.module';


import config from './helper/config';
@Module({
  imports: [AuthModule,
    ConfigModule.forRoot(
      {
        isGlobal: true,
        envFilePath: '.env',
        load: [config],

      }
    ),
    MailModule,
    SubjectModule,
    GroupModule,
    QuizModule
    EnrollmentModule,
    LessonModule,
    NotificationModule,
    ChatModule,

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
