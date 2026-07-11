import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { KeycloakAuthGuard } from '../../common/guards/keycloak.guard';
import { CerbosGuard } from '../../common/guards/cerbos.guard';
import { KeycloakRoles } from '../../common/decorators/keycloak-roles.decorator';
import { NotFoundException } from '@nestjs/common';
import { QueryUserDto } from './dto/query-user.dto';
import { PaginatedResponse } from '../../common/interfaces/paginated-response';
import { UserResponseDto } from './dto/response/user-response.dto';
import { Serialize } from '../../common/interceptors/serialize.interceptor';

@ApiTags('users')
@Controller('users')
@UseGuards(KeycloakAuthGuard, CerbosGuard)
@ApiBearerAuth()
@Serialize(UserResponseDto)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @KeycloakRoles('admin', 'view-users')
  @ApiOperation({ summary: 'Get all users with pagination' })
  @ApiQuery({ type: QueryUserDto })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
  })
  async findAll(
    @Query() query: QueryUserDto,
  ): Promise<PaginatedResponse<User>> {
    return await this.userService.findAll(query);
  }

  @Get(':id')
  @KeycloakRoles('admin', 'view-users')
  @ApiOperation({ summary: 'Get User by ID' })
  @ApiResponse({
    status: 200,
    description: 'User retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<User> {
    const user = await this.userService.findOne(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
  })
  async getMe(@Request() req) {
    // This will trigger JIT user creation if not exists
    const user = await this.userService.findOne(req.user.id);
    return user;
  }

  @Get('stats')
  @KeycloakRoles('admin')
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiResponse({
    status: 200,
    description: 'User stats retrieved successfully',
  })
  async getStats() {
    const stats = await this.userService.getUserStats();
    return {
      success: true,
      message: 'User statistics retrieved successfully',
      data: stats,
    };
  }

  @Post()
  @KeycloakRoles('admin', 'create-users')
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.userService.create(createUserDto);
  }

  @Put(':id')
  @KeycloakRoles('admin', 'edit-users')
  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @KeycloakRoles('admin', 'delete-users')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a user' })
  @ApiResponse({ status: 204, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async delete(@Param('id') id: string): Promise<void> {
    await this.userService.delete(id);
  }

  @Put(':id/deactivate')
  @KeycloakRoles('admin')
  @ApiOperation({ summary: 'Deactivate a user' })
  @ApiResponse({ status: 200, description: 'User deactivated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deactivate(@Param('id') id: string): Promise<User> {
    return this.userService.deactivate(id);
  }

  @Put(':id/activate')
  @KeycloakRoles('admin')
  @ApiOperation({ summary: 'Activate a user' })
  @ApiResponse({ status: 200, description: 'User activated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async activate(@Param('id') id: string): Promise<User> {
    return this.userService.activate(id);
  }
}
