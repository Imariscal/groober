import { IsString, IsUUID } from 'class-validator';

export class AssignPlanDto {
  @IsUUID()
  subscription_plan_id!: string;
}
