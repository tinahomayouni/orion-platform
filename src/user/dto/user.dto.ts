import { IsEmail, IsEnum, IsNotEmpty, IsString } from "class-validator";
import { Role } from "src/auth/enums/role.enum";
import { IsBoolean } from "class-validator";
import { IsDate } from "class-validator";

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsEnum(Role)
  role: Role;
    
  @IsBoolean()
  isActive: boolean;

  @IsDate()
  createdAt: Date;

  @IsDate()
  updatedAt: Date;
}