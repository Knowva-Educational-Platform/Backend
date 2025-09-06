import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { QuestionType } from "@prisma/client";

export class UpdateQuestionDto {
    @IsOptional()
    @IsString()
    question?: string;

    @IsOptional()
    @IsEnum(QuestionType)
    type?: QuestionType;

    @IsOptional()
    @IsString({ each: true })
    options?: string[];

    @IsOptional()
    @IsString()
    answer?: string;

    @IsOptional()
    @IsNumber()
    score?: number;
}
