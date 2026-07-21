import { IsString, MinLength, IsOptional, IsNumber, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateIssueDto {
  @IsString()
  @MinLength(3)
  title: string;

  @IsString()
  @MinLength(10)
  description: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string; // if omitted, AI service auto-suggests a category

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;
}
