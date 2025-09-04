import { IsNotEmpty, IsArray, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import CreateQuestionDto from "./create-question.dto";

class CreateQuizDto {
    @IsNotEmpty()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateQuestionDto)
    questions: CreateQuestionDto[];
}

export default CreateQuizDto;
