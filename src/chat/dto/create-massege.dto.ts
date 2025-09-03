import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsString, MinLength } from "class-validator";

export class CreateMessageDto {
  @Type(() => Number)
    @IsInt()
    @IsNotEmpty({ message: 'Conversation ID is required' })
  conversationId: number;

  @IsString()
  @MinLength(1)
  content: string;
}