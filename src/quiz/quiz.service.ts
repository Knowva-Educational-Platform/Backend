import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import CreateQuizDto from './dto/create-quiz.dto';
import UpdateQuizDto from './dto/update-quiz.dto';
import UpdateQuestionDto from './dto/update-question.dto';
import { QuestionType, QuizMode } from 'generated/prisma';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import AttemptQuizDto from './dto/attempt-quiz.dto';
@Injectable()
export class QuizService {
    constructor(private prisma: PrismaService) { }

    async createQuiz(subjectId: number, groupId: number, createdById: number, title: string, mode: QuizMode, createQuizDto?: CreateQuizDto) {
        const response = mode === QuizMode.AI ? await this.requestQuizFromAi() : createQuizDto;
        const quiz = await this.prisma.quiz.create({
            data: {
                mode, subjectId, groupId, createdById, title, questions: {
                    create: response!.questions.map(question => {
                        if (question.type === QuestionType.TrueFalse) {
                            return { ...question, options: ["True", "False"] }
                        }
                        return question;
                    })
                }
            }
        })
    }

    private async requestQuizFromAi() {
        const response = await fetch('https://test.com/v1/generate-quiz', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: [{ role: 'user', content: "content" }]
            })
        });
        const raw = await response.json();

        const dto = plainToInstance(CreateQuizDto, raw);

        const errors = await validate(dto);
        if (errors.length > 0) {
            throw new Error(`Validation failed: ${JSON.stringify(errors)}`);
        }
        return dto;
    }

    async getQuiz(id: number) {
        const quiz = await this.prisma.quiz.findUnique({
            where: { id }
        })
        return quiz
    }

    async updateQuiz(id: number, userId: number, updateQuizDto: UpdateQuizDto) {
        const quiz = await this.prisma.quiz.update({
            where: { id, createdById: userId },
            data: updateQuizDto
        })
        return quiz
    }

    async updateQuestion(id: number, userId: number, updateQuestionDto: UpdateQuestionDto) {
        const question = await this.prisma.question.update({
            where: { id, quiz: { createdById: userId } },
            data: updateQuestionDto
        })
        return question
    }

    async deleteQuiz(id: number, userId: number) {
        const quiz = await this.prisma.quiz.delete({
            where: { id, createdById: userId }
        })
        return quiz
    }

    async deleteQuestion(id: number, quizId: number, userId: number) {
        const question = await this.prisma.question.delete({
            where: { id, quizId, quiz: { createdById: userId } }
        })
        return question
    }

    async attemptQuiz(id: number, userId: number, attemptQuizDto: AttemptQuizDto) {
        const quiz = await this.prisma.quiz.findUnique({
            where: { id }
        })
        if (!quiz) {
            throw new Error('Quiz not found')
        }
        if (quiz.createdById === userId) {
            throw new Error('You cannot attempt your own quiz')
        }

        let totalScore = 0;
        const questions = await this.prisma.question.findMany({ where: { quizId: quiz.id } })
        const questionAttempts = attemptQuizDto.questions.map(questionAttempt => {
            const question = questions.find(q => q.id === questionAttempt.questionId)!
            if (question.type === QuestionType.MCQ || question.type === QuestionType.TrueFalse) {
                if (question.answer === questionAttempt.answer) {
                    totalScore += question.score
                    return { ...questionAttempt, score: question.score };
                }
            }
            else if (question.type === QuestionType.Written) {
                var score = this.calculateWrittenScore(question.answer, questionAttempt.answer);
                return { ...questionAttempt, score };
            }
            throw new InternalServerErrorException("Invalid question type")
        })

        const attempt = await this.prisma.quizAttempt.create({
            data: {
                quizId: quiz.id,
                studentId: userId,
                score: totalScore,
                studentAnswers: {
                    create: questionAttempts
                }
            }
        })
        return attempt
    }
}

