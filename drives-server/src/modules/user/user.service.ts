import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Op } from 'sequelize';
import { QueryBuilderService } from '../../common/services/query-builder/query-builder.service';
import { QueryUserDto } from './dto/query-user.dto';
import { PaginatedResponse } from '../../common/interfaces/paginated-response';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectModel(User)
    private userModel: typeof User,
    protected queryBuilder: QueryBuilderService,
  ) {}

  /**
   * JIT (Just-In-Time) user creation/update from Keycloak token
   */
  async upsertUserFromKeycloak(keycloakUser: any): Promise<User> {
    try {
      const userData: CreateUserDto = {
        id: keycloakUser.id,
        email: keycloakUser.email,
        username: keycloakUser.username,
        name:
          keycloakUser.name ||
          `${keycloakUser.firstName || ''} ${keycloakUser.lastName || ''}`.trim(),
        firstName: keycloakUser.firstName,
        lastName: keycloakUser.lastName,
        roles: keycloakUser.roles || [],
        realm: keycloakUser.realm,
        clientId: keycloakUser.clientId,
      };

      this.logger.log(
        `Upserting  user: ${keycloakUser.email} (${keycloakUser.id})`,
      );
      const [user, updated] = await this.userModel.upsert({
        ...userData,
        lastLogin: new Date(),
        isActive: true,
        roles: keycloakUser.roles,
      });

      // Reload to get fresh data
      await user.reload();

      return user;
    } catch (error) {
      this.logger.error(
        `Failed to upsert user from Keycloak: ${error.message}`,
        error.stack,
      );

      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new ConflictException(
          `User with email ${keycloakUser.email} already exists`,
        );
      }

      throw error;
    }
  }

  async findAll(query: QueryUserDto = {}): Promise<PaginatedResponse<User>> {
    try {
      const options = this.queryBuilder.buildQueryOptions(query);

      const { count, rows } = await this.userModel.findAndCountAll({
        ...options,
        distinct: true,
      });

      // TypeScript is happy now because query is guaranteed to exist
      const limit = options.limit || Number(query?.pageSize) || 10;
      const page = Number(query?.pageNumber) || 1;
      const totalPages = Math.ceil(count / limit);

      return new PaginatedResponse(rows, count, page, limit, totalPages);
    } catch (error) {
      this.logger.error('Error in finding all users:', error);
      throw new InternalServerErrorException(
        `Could not retrieve user records`,
        error,
      );
    }
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userModel.findByPk(id);

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({
      where: { email },
    });
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if user already exists
    const existing = await this.userModel.findOne({
      where: {
        [Op.or]: [{ id: createUserDto.id }, { email: createUserDto.email }],
      },
    });

    if (existing) {
      throw new ConflictException('User with this ID or email already exists');
    }

    return this.userModel.create({
      ...createUserDto,
      lastLogin: new Date(),
      firstLogin: new Date(),
      isActive: true,
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    return user.update(updateUserDto);
  }

  async delete(id: string): Promise<void> {
    const user = await this.findOne(id);

    // Soft delete (if paranoid is enabled) or hard delete
    await user.destroy();
  }

  async deactivate(id: string): Promise<User> {
    const user = await this.findOne(id);

    return user.update({
      isActive: false,
      lastLogin: new Date(),
    });
  }

  async activate(id: string): Promise<User> {
    const user = await this.findOne(id);

    return user.update({
      isActive: true,
      lastLogin: new Date(),
    });
  }

  async updateLastLogin(id: string): Promise<User> {
    const user = await this.findOne(id);

    return user.update({
      lastLogin: new Date(),
    });
  }

  async getUserStats(): Promise<any> {
    const totalUsers = await this.userModel.count();
    const activeUsers = await this.userModel.count({
      where: { isActive: true },
    });
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayLogins = await this.userModel.count({
      where: {
        lastLogin: {
          [Op.gte]: today,
        },
      },
    });

    return {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      todayLogins,
    };
  }
}
