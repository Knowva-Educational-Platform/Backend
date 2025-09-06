import { IsInt, IsNotEmpty } from "class-validator";

export class CreateGroupConversationDto {

  @IsInt()
  @IsNotEmpty()
  groupId: number;
}