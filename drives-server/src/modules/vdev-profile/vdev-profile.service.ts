import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { VdevProfile } from './entities/vdev-profile.entity';
import { LogicalVdev } from '../logical-vdev/entities/logical-vdev.entity';
import { CreateVdevProfileDto } from './dto/create-vdev-profile.dto';
import { UpdateVdevProfileDto } from './dto/update-vdev-profile.dto';
import { QueryVdevProfileDto } from './dto/query-vdev-profile.dto';
import { PaginationService } from '../pagination/pagination.service';
import { PaginatedResponse } from '../pagination/interfaces/paginated-response';

@Injectable()
export class VdevProfileService {
  constructor(
    @InjectModel(VdevProfile)
    private readonly vdevProfileModel: typeof VdevProfile,
    @InjectModel(LogicalVdev)
    private readonly logicalVdevModel: typeof LogicalVdev,
    private readonly paginationService: PaginationService,
  ) {}

  async findAll(
    query?: QueryVdevProfileDto,
  ): Promise<PaginatedResponse<VdevProfile>> {
    return this.paginationService.paginate<VdevProfile>(
      this.vdevProfileModel,
      query,
    );
  }

  async findOne(id: string): Promise<VdevProfile> {
    const profile = await this.vdevProfileModel.findByPk(id);
    if (!profile) {
      throw new NotFoundException(`VdevProfile with ID ${id} not found`);
    }
    return profile;
  }

  async create(dto: CreateVdevProfileDto): Promise<VdevProfile> {
    await this.assertCodeAvailable(dto.code);
    this.assertMemberRange(dto.minMembers, dto.maxMembers);

    return this.vdevProfileModel.create({
      ...dto,
      technology: dto.technology ?? 'GENERIC',
      minMembers: dto.minMembers ?? 1,
      maxMembers: dto.maxMembers ?? null,
      parityMembers: dto.parityMembers ?? 0,
      mirrorCopies: dto.mirrorCopies ?? 1,
      stripeWidth: dto.stripeWidth ?? null,
      capacityMode: dto.capacityMode ?? 'SUM',
      metadata: dto.metadata ?? null,
      managed: false,
      sortOrder: dto.sortOrder ?? 0,
    } as Partial<VdevProfile>);
  }

  async update(id: string, dto: UpdateVdevProfileDto): Promise<VdevProfile> {
    const profile = await this.findOne(id);
    if (dto.code && dto.code !== profile.code) {
      await this.assertCodeAvailable(dto.code, id);
    }
    this.assertMemberRange(
      dto.minMembers ?? profile.minMembers,
      dto.maxMembers !== undefined ? dto.maxMembers : profile.maxMembers,
    );

    const update: Partial<VdevProfile> = {};
    for (const key of [
      'code',
      'displayName',
      'technology',
      'minMembers',
      'maxMembers',
      'parityMembers',
      'mirrorCopies',
      'stripeWidth',
      'capacityMode',
      'metadata',
      'sortOrder',
    ] as const) {
      if (dto[key] !== undefined) {
        (update as Record<string, unknown>)[key] = dto[key];
      }
    }

    await profile.update(update);
    return profile;
  }

  async delete(id: string): Promise<boolean> {
    const profile = await this.findOne(id);
    const inUse = await this.logicalVdevModel.count({
      where: { redundancyProfileId: id },
    });
    if (inUse > 0) {
      throw new ConflictException(
        `VdevProfile ${id} is used by ${inUse} vdev(s) and cannot be deleted`,
      );
    }
    await profile.destroy();
    return true;
  }

  private async assertCodeAvailable(
    code: string,
    exceptId?: string,
  ): Promise<void> {
    const existing = await this.vdevProfileModel.findOne({
      where: { code },
    });
    if (existing && existing.id !== exceptId) {
      throw new ConflictException(
        `VdevProfile with code "${code}" already exists`,
      );
    }
  }

  private assertMemberRange(
    minMembers?: number,
    maxMembers?: number | null,
  ): void {
    if (
      maxMembers !== undefined &&
      maxMembers !== null &&
      minMembers !== undefined &&
      maxMembers < minMembers
    ) {
      throw new ConflictException(
        'maxMembers must be greater than or equal to minMembers',
      );
    }
  }
}
