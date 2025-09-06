import { IsNotEmpty, IsNumber, IsString } from "class-validator";

class AttemptQuestionDto {
    @IsNotEmpty()
    @IsNumber()
    questionId: number;

    @IsNotEmpty()
    @IsString()
    answer: string;
}

export default AttemptQuestionDto;
