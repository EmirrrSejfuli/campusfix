import { IsArray, IsUUID, IsOptional, IsEnum } from 'class-validator';
import { IssueStatus, IssueUrgency } from '../entities/issue.entity';

export class BulkUpdateIssueDto {
  @IsArray()
  @IsUUID('4', { each: true })
  ids: string[];

  @IsOptional()
  @IsEnum(IssueStatus)
  status?: IssueStatus;

  @IsOptional()
  @IsEnum(IssueUrgency)
  urgency?: IssueUrgency;
}
