import { IsOptional, IsEnum, IsString, IsUUID } from 'class-validator';
import { IssueStatus, IssueUrgency } from '../entities/issue.entity';

export class QueryIssueDto {
  @IsOptional()
  @IsEnum(IssueStatus)
  status?: IssueStatus;

  @IsOptional()
  @IsEnum(IssueUrgency)
  urgency?: IssueUrgency;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  mine?: string; // when set to the requester's own id, restricts results to their reports
}
