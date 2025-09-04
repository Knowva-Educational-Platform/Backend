import { IsEnum, IsOptional, IsString } from "class-validator";
import { QuestionType } from "generated/prisma/client";

class UpdateQuestionDto {
    @IsOptional()
    @IsString()
    question: string;
    @IsOptional()
    @IsEnum(QuestionType)
    type: QuestionType;
    @IsOptional()
    @IsString({ each: true })
    options: string[];
    @IsOptional()
    @IsString()
    answer: string;
}

export default UpdateQuestionDto;
