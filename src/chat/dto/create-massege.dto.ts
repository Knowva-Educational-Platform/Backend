import { Type } from "class-transformer";
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";

export class CreateMessageDto {


  @IsString()
  @IsNotEmpty()
  content: string;


  @IsInt()
  @IsNotEmpty()
  conversationId: number;


  @IsString()
  @IsOptional()
  mediaUrl?: string;

  
  @IsString()
  @IsOptional()
  @IsEnum(['image', 'video', 'audio', 'document', 'pdf'])
  mediaType?: string;

}