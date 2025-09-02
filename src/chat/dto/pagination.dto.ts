import { Type } from "class-transformer";
import { IsInt, Min } from "class-validator";

export class PaginationDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip = 0;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  take = 20;
}