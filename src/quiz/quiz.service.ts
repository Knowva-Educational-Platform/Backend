import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { QuestionMode, QuestionType } from 'generated/prisma';
import { UpdateQuestionDto } from './dto/update-question.dto';
@Injectable()
export class QuizService {
    constructor(private prisma: PrismaService) { }

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
        return this.prisma.quiz.create({ data: { ...createQuizDto, createdById: userId } });
    }

    async updateQuiz(id: number, userId: number, updateQuizDto: UpdateQuizDto) {
        return this.prisma.quiz.update({ where: { id, createdById: userId }, data: updateQuizDto });
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
        return this.prisma.quiz.update({
            where: { id: quizId, createdById: userId, startsAt: { lte: new Date() }, endsAt: { gt: new Date() } },
            data: {
                attempts: { create: { studentId: userId } }
            }
        });
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
}
