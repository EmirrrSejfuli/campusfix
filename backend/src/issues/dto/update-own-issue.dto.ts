import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateOwnIssueDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;
}
