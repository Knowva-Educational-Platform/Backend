import { IsBoolean, IsDateString, IsNumber, IsOptional, IsString } from "class-validator";

export class UpdateQuizDto {
    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsNumber()
    subjectId?: number;

    @IsOptional()
    @IsNumber()
    groupId?: number;

    @IsOptional()
    @IsDateString()
    startsAt?: Date;

    @IsOptional()
    @IsDateString()
    endsAt?: Date;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsBoolean()
    canChangeAnswer?: boolean;
}
