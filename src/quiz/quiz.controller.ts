import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    UseGuards,
    Request,
    ParseIntPipe,
    HttpCode,
    HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { QuizService } from './quiz.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { AuthenticationGuard } from '../guards/authentication.guard';
import { AuthorizationGuard } from '../guards/authorization.guard';
import { Roles } from '../decorator/decorator/roles.decorator';
import { Role } from 'generated/prisma';

@ApiTags('Quiz')
@Controller('quiz')
@UseGuards(AuthenticationGuard, AuthorizationGuard)
@ApiBearerAuth()
export class QuizController {
    constructor(private readonly quizService: QuizService) { }

    // Quiz Management Endpoints
    @Get()
    @Roles(Role.TEACHER)
    @ApiOperation({ summary: 'Get all quizzes for the authenticated teacher' })
    @ApiResponse({ status: 200, description: 'List of quizzes retrieved successfully' })
    async getQuizzes(@Request() req) {
        return this.quizService.getQuizes(req.user.id);
    }

    @Get(':id')
    @Roles(Role.TEACHER)
    @ApiOperation({ summary: 'Get a specific quiz by ID' })
    @ApiParam({ name: 'id', description: 'Quiz ID' })
    @ApiResponse({ status: 200, description: 'Quiz retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Quiz not found' })
    async getQuiz(@Param('id', ParseIntPipe) id: number, @Request() req) {
        return this.quizService.getQuiz(id, req.user.id);
    }

    @Post()
    @Roles(Role.TEACHER)
    @ApiOperation({ summary: 'Create a new quiz' })
    @ApiBody({ type: CreateQuizDto })
    @ApiResponse({ status: 201, description: 'Quiz created successfully' })
    @ApiResponse({ status: 400, description: 'Invalid input data' })
    async createQuiz(@Body() createQuizDto: CreateQuizDto, @Request() req) {
        return this.quizService.createQuiz(req.user.id, createQuizDto);
    }

    @Put(':id')
    @Roles(Role.TEACHER)
    @ApiOperation({ summary: 'Update a quiz' })
    @ApiParam({ name: 'id', description: 'Quiz ID' })
    @ApiBody({ type: UpdateQuizDto })
    @ApiResponse({ status: 200, description: 'Quiz updated successfully' })
    @ApiResponse({ status: 404, description: 'Quiz not found' })
    async updateQuiz(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateQuizDto: UpdateQuizDto,
        @Request() req
    ) {
        return this.quizService.updateQuiz(id, req.user.id, updateQuizDto);
    }

    @Post(':id/duplicate')
    @Roles(Role.TEACHER)
    @ApiOperation({ summary: 'Duplicate a quiz' })
    @ApiParam({ name: 'id', description: 'Quiz ID to duplicate' })
    @ApiResponse({ status: 201, description: 'Quiz duplicated successfully' })
    @ApiResponse({ status: 404, description: 'Quiz not found' })
    async duplicateQuiz(@Param('id', ParseIntPipe) id: number, @Request() req) {
        return this.quizService.duplicateQuiz(id, req.user.id);
    }

    // Question Management Endpoints
    @Get('questions')
    @Roles(Role.TEACHER)
    @ApiOperation({ summary: 'Get all questions for the authenticated teacher' })
    @ApiResponse({ status: 200, description: 'List of questions retrieved successfully' })
    async getQuestions(@Request() req) {
        return this.quizService.getQuestions(req.user.id);
    }

    @Get('questions/:id')
    @Roles(Role.TEACHER)
    @ApiOperation({ summary: 'Get a specific question by ID' })
    @ApiParam({ name: 'id', description: 'Question ID' })
    @ApiResponse({ status: 200, description: 'Question retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Question not found' })
    async getQuestion(@Param('id', ParseIntPipe) id: number, @Request() req) {
        return this.quizService.getQuestion(id, req.user.id);
    }

    @Post(':quizId/questions')
    @Roles(Role.TEACHER)
    @ApiOperation({ summary: 'Add a manual question to a quiz' })
    @ApiParam({ name: 'quizId', description: 'Quiz ID' })
    @ApiBody({ type: CreateQuestionDto })
    @ApiResponse({ status: 201, description: 'Question added to quiz successfully' })
    @ApiResponse({ status: 400, description: 'Invalid input data' })
    async addManualQuestionToQuiz(
        @Param('quizId', ParseIntPipe) quizId: number,
        @Body() createQuestionDto: CreateQuestionDto,
        @Request() req
    ) {
        return this.quizService.addManualQuestionToQuiz(req.user.id, quizId, createQuestionDto);
    }

    @Post(':quizId/questions/:questionId')
    @Roles(Role.TEACHER)
    @ApiOperation({ summary: 'Add an existing question to a quiz' })
    @ApiParam({ name: 'quizId', description: 'Quiz ID' })
    @ApiParam({ name: 'questionId', description: 'Question ID to add' })
    @ApiResponse({ status: 200, description: 'Question added to quiz successfully' })
    @ApiResponse({ status: 404, description: 'Quiz or question not found' })
    async addOldQuestionToQuiz(
        @Param('quizId', ParseIntPipe) quizId: number,
        @Param('questionId', ParseIntPipe) questionId: number,
        @Request() req
    ) {
        return await this.quizService.addOldQuestionToQuiz(req.user.id, quizId, questionId);
    }

    @Post(':quizId/questions/ai')
    @Roles(Role.TEACHER)
    @ApiOperation({ summary: 'Add AI-generated questions to a quiz' })
    @ApiParam({ name: 'quizId', description: 'Quiz ID' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                questions: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/CreateQuestionDto' }
                }
            },
            required: ['questions']
        }
    })
    @ApiResponse({ status: 201, description: 'AI questions added to quiz successfully' })
    @ApiResponse({ status: 400, description: 'Invalid input data' })
    @ApiResponse({ status: 404, description: 'Quiz not found' })
    async addAiQuestionsToQuiz(
        @Param('quizId', ParseIntPipe) quizId: number,
        @Body() body: { noOfQuestions: number },
        @Request() req
    ) {
        return this.quizService.addAiQuestionsToQuiz(req.user.id, quizId, body.noOfQuestions);
    }

    @Post('questions/:id/duplicate')
    @Roles(Role.TEACHER)
    @ApiOperation({ summary: 'Duplicate a question' })
    @ApiParam({ name: 'id', description: 'Question ID to duplicate' })
    @ApiResponse({ status: 201, description: 'Question duplicated successfully' })
    @ApiResponse({ status: 404, description: 'Question not found' })
    async duplicateQuestion(@Param('id', ParseIntPipe) id: number, @Request() req) {
        return this.quizService.duplicateQuestion(req.user.id, id);
    }

    @Put('questions/:id')
    @Roles(Role.TEACHER)
    @ApiOperation({ summary: 'Update a question' })
    @ApiParam({ name: 'id', description: 'Question ID' })
    @ApiBody({ type: UpdateQuestionDto })
    @ApiResponse({ status: 200, description: 'Question updated successfully' })
    @ApiResponse({ status: 404, description: 'Question not found' })
    async updateQuestion(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateQuestionDto: UpdateQuestionDto,
        @Request() req
    ) {
        return this.quizService.updateQuestion(req.user.id, id, updateQuestionDto);
    }

    @Put('questions/:id/remove-from-quiz')
    @Roles(Role.TEACHER)
    @ApiOperation({ summary: 'Remove a question from its quiz' })
    @ApiParam({ name: 'id', description: 'Question ID' })
    @ApiResponse({ status: 200, description: 'Question removed from quiz successfully' })
    @ApiResponse({ status: 404, description: 'Question not found' })
    async removeQuestionFromQuiz(@Param('id', ParseIntPipe) id: number, @Request() req) {
        return this.quizService.removeQuestionFromQuiz(req.user.id, id);
    }

    @Delete('questions/:id')
    @Roles(Role.TEACHER)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a question' })
    @ApiParam({ name: 'id', description: 'Question ID' })
    @ApiResponse({ status: 204, description: 'Question deleted successfully' })
    @ApiResponse({ status: 404, description: 'Question not found' })
    async deleteQuestion(@Param('id', ParseIntPipe) id: number, @Request() req) {
        return this.quizService.deleteQuestion(req.user.id, id);
    }

    // Quiz Attempt Endpoints
    @Get(':id/attempts/my')
    @Roles(Role.STUDENT)
    @ApiOperation({ summary: 'Get my quiz attempts' })
    @ApiParam({ name: 'id', description: 'Quiz ID' })
    @ApiResponse({ status: 200, description: 'Quiz attempts retrieved successfully' })
    async getMyQuizAttempts(@Param('id', ParseIntPipe) id: number, @Request() req) {
        return this.quizService.getMyQuizAttempts(req.user.id, id);
    }

    @Get(':id/attempts')
    @Roles(Role.TEACHER)
    @ApiOperation({ summary: 'Get all quiz attempts for a quiz' })
    @ApiParam({ name: 'id', description: 'Quiz ID' })
    @ApiResponse({ status: 200, description: 'Quiz attempts retrieved successfully' })
    async getQuizAttempts(@Param('id', ParseIntPipe) id: number, @Request() req) {
        return this.quizService.getQuizAttempts(id, req.user.id);
    }

    @Post(':id/start')
    @Roles(Role.STUDENT)
    @ApiOperation({ summary: 'Start a quiz attempt' })
    @ApiParam({ name: 'id', description: 'Quiz ID' })
    @ApiResponse({ status: 201, description: 'Quiz attempt started successfully' })
    @ApiResponse({ status: 400, description: 'Quiz not available for attempt' })
    async startQuizAttempt(@Param('id', ParseIntPipe) id: number, @Request() req) {
        return this.quizService.startQuizAttempt(req.user.id, id);
    }

    @Post('attempts/:quizAttemptId/answers')
    @Roles(Role.STUDENT)
    @ApiOperation({ summary: 'Add an answer to a quiz attempt' })
    @ApiParam({ name: 'quizAttemptId', description: 'Quiz Attempt ID' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                questionId: { type: 'number' },
                answer: { type: 'string' }
            },
            required: ['questionId', 'answer']
        }
    })
    @ApiResponse({ status: 201, description: 'Answer added successfully' })
    @ApiResponse({ status: 400, description: 'Invalid input data' })
    async addQuestionAnswer(
        @Param('quizAttemptId', ParseIntPipe) quizAttemptId: number,
        @Body() body: { questionId: number; answer: string }
    ) {
        return this.quizService.addQuestionAnswer(quizAttemptId, body.questionId, body.answer);
    }

    @Put('attempts/:quizAttemptId/answers')
    @Roles(Role.STUDENT)
    @ApiOperation({ summary: 'Update an answer in a quiz attempt' })
    @ApiParam({ name: 'quizAttemptId', description: 'Quiz Attempt ID' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                questionId: { type: 'number' },
                answer: { type: 'string' }
            },
            required: ['questionId', 'answer']
        }
    })
    @ApiResponse({ status: 200, description: 'Answer updated successfully' })
    @ApiResponse({ status: 400, description: 'Invalid input data or quiz not editable' })
    async updateQuestionAnswer(
        @Param('quizAttemptId', ParseIntPipe) quizAttemptId: number,
        @Body() body: { questionId: number; answer: string }
    ) {
        return this.quizService.updateQuestionAnswer(quizAttemptId, body.questionId, body.answer);
    }
}
