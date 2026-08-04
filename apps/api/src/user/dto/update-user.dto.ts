import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

// password updates should go through a dedicated "change password" flow,
// so it's omitted here to keep this endpoint simple.
export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password'] as const),
) {}
