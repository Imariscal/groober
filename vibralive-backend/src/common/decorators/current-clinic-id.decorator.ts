import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentClinicId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.clinic_id || request.clinicId;
  },
);
