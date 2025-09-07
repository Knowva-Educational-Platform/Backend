import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { QuestionMode, QuestionType, NotificationType } from '@prisma/client';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { validate } from 'class-validator';
import { NotificationService } from 'src/notification/notification.service';
import { NotificationGateway } from 'src/notification/notification.gateway';

@Injectable()
export class QuizService {
    constructor(private prisma: PrismaService, private notifications: NotificationService,
        private readonly notificationGateway: NotificationGateway
    ) { }

    async getQuizes(userId: number) {
        return this.prisma.quiz.findMany({ where: { createdById: userId } });
    }

    async getQuiz(id: number, userId: number) {
        return this.prisma.quiz.findUnique({
            where: { id, createdById: userId },
            include: { questions: true }
        });
    }

    async createQuiz(userId: number, createQuizDto: CreateQuizDto) {
        if (new Date(createQuizDto.endsAt) <= new Date(createQuizDto.startsAt)) {
            throw new BadRequestException('endsAt must be after startsAt');
        }
        const quiz = await this.prisma.quiz.create({ data: { ...createQuizDto, createdById: userId } });
        const members = await this.prisma.membership.findMany({ where: { groupId: quiz.groupId, status: 'APPROVED' }, select: { studentId: true } });
        for (const m of members) {
            await this.notifications.create(m.studentId, `New quiz: ${quiz.title} starts at ${quiz.startsAt.toISOString()}`, NotificationType.QUIZ_ASSIGNED);
            this.notificationGateway.sendNotification(m.studentId.toString(), `New quiz: ${quiz.title} starts at ${quiz.startsAt.toISOString()}`);
        }
        return quiz;
    }

    async updateQuiz(id: number, userId: number, updateQuizDto: UpdateQuizDto) {
        const quiz = await this.prisma.quiz.update({ where: { id, createdById: userId }, data: updateQuizDto });
        return quiz;
    }

    async duplicateQuiz(id: number, userId: number) {
        const quiz = await this.prisma.quiz.findUnique({
            where: {
                id,
                createdById: userId
            },
            include: {
                questions: {
                    select: { id: true }
                }
            }
        });

        if (!quiz) {
            throw new InternalServerErrorException('Quiz not found');
        }

        const newQuiz = await this.prisma.quiz.create({
            data: {
                ...quiz,
                title: `${quiz.title} Copy`,
                createdById: userId,
                questions: {
                    connect: quiz.questions.map((question) => ({ id: question.id }))
                }
            }
        });
        return newQuiz;
    }

    async getQuestions(userId: number) {
        return this.prisma.question.findMany({ where: { createdById: userId } });
    }

    async getQuestion(id: number, userId: number) {
        return this.prisma.question.findUnique({ where: { id, createdById: userId } });
    }

    async addOldQuestionToQuiz(userId: number, quizId: number, questionId: number) {
        const question = await this.prisma.question.findUnique({
            where: {
                id: questionId,
                createdById: userId
            }
        });

        if (!question) {
            throw new InternalServerErrorException('Question not found');
        }

        return await this.prisma.question.create({ data: { ...question, createdById: userId, quizId } });
    }

    private validateQuestionOptions(question: any) {
        if (question.type === QuestionType.TrueFalse) {
            if (question.answer !== 'True' && question.answer !== 'False')
                throw new InternalServerErrorException('Answer must be True or False');

            question.options = ['True', 'False'];
        }
        else if (question.type === QuestionType.Written) {
            question.options = [];
        }
    }

    async addManualQuestionToQuiz(userId: number, quizId: number, questionDto: CreateQuestionDto) {
        this.validateQuestionOptions(questionDto);

        return this.prisma.question.create({
            data: { ...questionDto, createdById: userId, quizId, mode: QuestionMode.MANUAL }
        });
    }

    async addAiQuestionsToQuiz(userId: number, quizId: number, noOfQuestions: number) {
        // TODO: fetch questions from proccess.env.KNOWVA_AI_API using axios asking for <noOfQuestions> Ai generated questions
        // and the response should be { questions: CreateQuestionDto[] }
        // validate each dto and its options then add them to the database
        const questionDtos: CreateQuestionDto[] = [];

        for (const questionDto of questionDtos) {
            const errors = await validate(questionDto);
            if (errors.length > 0) {
                throw new InternalServerErrorException('Invalid question data');
            }

            this.validateQuestionOptions(questionDto);
            await this.prisma.question.create({ data: { ...questionDto, createdById: userId, quizId, mode: QuestionMode.AI } });
        }
        return { count: questionDtos.length };
    }

    async saveAiQuestions(userId: number, quizId: number, questions: CreateQuestionDto[]) {
        const quiz = await this.prisma.quiz.findUnique({ where: { id: quizId, createdById: userId } });
        if (!quiz) throw new BadRequestException('Quiz not found');
        for (const q of questions) {
            this.validateQuestionOptions(q);
            await this.prisma.question.create({ data: { ...q, createdById: userId, quizId, mode: QuestionMode.AI } });
        }
        return { count: questions.length };
    }

    async duplicateQuestion(userId: number, questionId: number) {
        const question = await this.prisma.question.findUnique({
            where: {
                id: questionId,
                createdById: userId
            }
        });

        if (!question) {
            throw new InternalServerErrorException('Question not found');
        }

        const newQuestion = await this.prisma.question.create({ data: question });
        return newQuestion;
    }

    async updateQuestion(userId: number, questionId: number, questionDto: UpdateQuestionDto) {
        this.validateQuestionOptions(questionDto);

        return this.prisma.question.update({ where: { id: questionId, createdById: userId }, data: questionDto });
    }

    async removeQuestionFromQuiz(userId: number, questionId: number) {
        return this.prisma.question.update({
            where: { id: questionId, createdById: userId },
            data: { quizId: undefined }
        });
    }

    async deleteQuestion(userId: number, questionId: number) {
        return this.prisma.question.delete({ where: { id: questionId, createdById: userId, quizId: undefined } });
    }

    async getMyQuizAttempts(userId: number, quizId: number) {
        return await this.prisma.quizAttempt.findMany({ where: { studentId: userId, quizId } });
    }

    async getQuizAttempts(quizId: number, userId: number) {
        return await this.prisma.quiz.findMany({ where: { id: quizId, createdById: userId }, select: { attempts: true } });
    }

    async startQuizAttempt(userId: number, quizId: number) {
        const quiz = await this.prisma.quiz.findUnique({ where: { id: quizId } });
        if (!quiz) throw new BadRequestException('Quiz not found');
        if (quiz.startsAt > new Date() || quiz.endsAt <= new Date()) {
            throw new BadRequestException('Quiz is not available');
        }
        const attempt = await this.prisma.quizAttempt.create({ data: { quizId, studentId: userId } });
        await this.notifications.create(quiz.createdById, `Student ${userId} started quiz: ${quiz.title}`, NotificationType.QUIZ_ASSIGNED);
        this.notificationGateway.sendNotification(quiz.createdById.toString(), `Student ${userId} started quiz: ${quiz.title}`);
        return attempt;
    }

    async addQuestionAnswer(quizAttemptId: number, questionId: number, answer: string) {
        return this.prisma.studentAnswer.create({ data: { quizAttemptId, questionId, answer } });
    }

    async updateQuestionAnswer(quizAttemptId: number, questionId: number, answer: string) {
        return this.prisma.studentAnswer.update({
            where: {
                quizAttemptId_questionId: {
                    quizAttemptId,
                    questionId,
                },
                quizAttempt: {
                    quiz: {
                        canChangeAnswer: true,
                        endsAt: { gt: new Date() }
                    }
                }
            },
            data: { answer }
        });
    }

    async finishQuizAttempt(userId: number, quizAttemptId: number) {
        const attempt = await this.prisma.quizAttempt.findUnique({ where: { id: quizAttemptId }, include: { quiz: true, studentAnswers: { include: { question: true } } } });
        if (!attempt || attempt.studentId !== userId) throw new BadRequestException('Attempt not found');
        let score = 0;
        let total = 0;
        for (const ans of attempt.studentAnswers as any[]) {
            total += ans.question.score;
            if (ans.question.type === 'Written') continue;
            if (ans.answer === ans.question.answer) score += ans.question.score;
        }
        await this.prisma.quizAttempt.update({ where: { id: quizAttemptId }, data: { score } });
        await this.notifications.create(userId, `Your results for quiz "${attempt.quiz.title}": ${score}/${total}`, NotificationType.QUIZ_COMPLETED);
        this.notificationGateway.sendNotification(userId.toString(), `Your results for quiz "${attempt.quiz.title}": ${score}/${total}`);
        return { score, total };
    }
}
