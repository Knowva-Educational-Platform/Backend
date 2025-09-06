import { IsInt } from "class-validator";

export class CreateConversationDto {
  @IsInt()
  teacherId: number;
}
