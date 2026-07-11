import { IsString, IsEmail, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'Keycloak subject ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  id: string;

  @ApiProperty({ description: 'User email', example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Username', example: 'johndoe' })
  @IsString()
  username: string;

  @ApiProperty({ description: 'Full name', example: 'John Doe' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'First name', example: 'John' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ description: 'Last name', example: 'Doe' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Keycloak roles',
    example: ['admin', 'user'],
  })
  @IsOptional()
  @IsArray()
  roles?: string[];

  @ApiPropertyOptional({ description: 'Keycloak realm', example: 'master' })
  @IsOptional()
  @IsString()
  realm?: string;

  @ApiPropertyOptional({ description: 'Client ID', example: 'iris-app' })
  @IsOptional()
  @IsString()
  clientId?: string;
}
