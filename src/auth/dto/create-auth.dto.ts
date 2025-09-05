import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
export class CreateAuthDto {

    @IsNotEmpty({ message: "Name should not be empty" })
    @IsString()
    name: string;
    @IsEmail()
    @IsNotEmpty()
    email: string;
    @IsNotEmpty()
    @IsString()
    password: string;
    @IsNotEmpty()
    @IsString()
    confirmPassword: string;

    @IsOptional()
    roleToken?: string;
    @IsOptional()
    phoneNumber?: string;
    
    @IsOptional()
    bio?: string;
    @IsNotEmpty({ message: 'Gender is required' })
    @IsEnum(['male', 'female'], { message: 'Gender must be either "male" or "female"' })
    gender: string
}
