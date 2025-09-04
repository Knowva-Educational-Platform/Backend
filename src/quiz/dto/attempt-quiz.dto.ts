import { IsArray, IsNotEmpty, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import AttemptQuestionDto from "./attempt-question.dto";

class AttemptQuizDto {
    @IsNotEmpty()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AttemptQuestionDto)
    questions: AttemptQuestionDto[];
}

export default AttemptQuizDto;
