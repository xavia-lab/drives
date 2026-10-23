import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { VdevProfile } from './entities/vdev-profile.entity';

@Injectable()
export class VdevProfileService {
  constructor(
    @InjectModel(VdevProfile)
    private readonly vdevProfileModel: typeof VdevProfile,
  ) {}

  async findAll(): Promise<VdevProfile[]> {
    return this.vdevProfileModel.findAll({
      order: [
        ['sortOrder', 'ASC'],
        ['displayKey', 'ASC'],
      ],
    });
  }

  async findOne(id: string): Promise<VdevProfile> {
    const profile = await this.vdevProfileModel.findByPk(id);
    if (!profile) {
      throw new NotFoundException(`VdevProfile with ID ${id} not found`);
    }
    return profile;
  }
}
