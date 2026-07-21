import { IsOptional, IsEnum } from 'class-validator';
import { IssueStatus, IssueUrgency } from '../entities/issue.entity';

export class UpdateIssueDto {
  @IsOptional()
  @IsEnum(IssueStatus)
  status?: IssueStatus;

  @IsOptional()
  @IsEnum(IssueUrgency)
  urgency?: IssueUrgency;
}
