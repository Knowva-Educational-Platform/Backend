import { IsString, IsOptional } from "class-validator";

class UpdateQuizDto {
    @IsOptional()
    @IsString()
    title: string;
}

export default UpdateQuizDto;
