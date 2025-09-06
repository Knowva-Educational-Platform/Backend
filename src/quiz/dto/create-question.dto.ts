import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { QuestionType } from "generated/prisma/client";

export class CreateQuestionDto {
    @IsNotEmpty()
    @IsString()
    question: string;

    @IsNotEmpty()
    @IsEnum(QuestionType)
    type: QuestionType;

    @IsOptional()
    @IsString({ each: true })
    options?: string[];

    @IsNotEmpty()
    @IsString()
    answer: string;

    @IsNotEmpty()
    @IsNumber()
    score: number;
}
