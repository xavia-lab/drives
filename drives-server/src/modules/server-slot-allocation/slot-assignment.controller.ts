import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ServerSlotAllocationService } from './server-slot-allocation.service';
import { MountDriveDto } from './dto/mount-drive.dto';
import { SaveSlotAssignmentsDto } from './dto/save-slot-assignments.dto';
import { SlotAssignmentBoardResponseDto } from './dto/response/slot-assignment-board-response.dto';
import { KeycloakAuthGuard } from '../../common/guards/keycloak.guard';
import { CerbosGuard } from '../../common/guards/cerbos.guard';
import { Serialize } from '../../common/interceptors/serialize.interceptor';
import { Public } from '../../common/decorators/public.decorator';
import { CheckPolicy } from '../../common/decorators/check-policy.decorator';
import { RequestUser } from '../../common/decorators/request-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-request.interface';

@ApiTags('slot-assignment')
@Controller('physical-servers')
@UseGuards(KeycloakAuthGuard, CerbosGuard)
@ApiBearerAuth()
@Serialize(SlotAssignmentBoardResponseDto)
export class SlotAssignmentController {
  constructor(
    private readonly allocationService: ServerSlotAllocationService,
  ) {}

  @Get(':id/slot-assignment-board')
  @Public()
  @ApiOperation({
    summary:
      'Get the slot assignment board for a physical server (slots + occupancy + free drives in the same datacenter)',
  })
  @ApiParam({ name: 'id', description: 'The physical server UUIDv7 id' })
  @ApiResponse({ status: 200, type: SlotAssignmentBoardResponseDto })
  @ApiResponse({ status: 404, description: 'Physical Server not found' })
  async getBoard(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<SlotAssignmentBoardResponseDto> {
    return this.allocationService.getBoard(id);
  }

  @Post(':id/slots/:slotId/mount')
  @CheckPolicy('mount', 'server-slot-allocations')
  @ApiOperation({
    summary: 'Mount a physical drive into a server slot',
  })
  @ApiParam({ name: 'id', description: 'The physical server UUIDv7 id' })
  @ApiParam({ name: 'slotId', description: 'The server slot UUIDv7 id' })
  @ApiResponse({ status: 201, type: SlotAssignmentBoardResponseDto })
  @ApiResponse({
    status: 400,
    description: 'The slot does not belong to the addressed server',
  })
  @ApiResponse({ status: 404, description: 'Server, slot or drive not found' })
  @ApiResponse({
    status: 409,
    description:
      'Slot occupied, drive already mounted here, or drive not located in the server datacenter',
  })
  async mount(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Param('slotId', new ParseUUIDPipe({ version: '7' })) slotId: string,
    @Body() dto: MountDriveDto,
    @RequestUser() user?: AuthenticatedUser,
  ): Promise<SlotAssignmentBoardResponseDto> {
    return this.allocationService.mount(
      id,
      slotId,
      dto.physicalDriveId,
      this.resolveActorId(user),
    );
  }

  @Post(':id/slots/:slotId/unmount')
  @CheckPolicy('unmount', 'server-slot-allocations')
  @ApiOperation({
    summary: 'Unmount the drive currently seated in a server slot',
  })
  @ApiParam({ name: 'id', description: 'The physical server UUIDv7 id' })
  @ApiParam({ name: 'slotId', description: 'The server slot UUIDv7 id' })
  @ApiResponse({ status: 201, type: SlotAssignmentBoardResponseDto })
  @ApiResponse({
    status: 400,
    description: 'The slot does not belong to the addressed server',
  })
  @ApiResponse({ status: 404, description: 'Server or slot not found' })
  @ApiResponse({ status: 409, description: 'The slot does not hold a drive' })
  async unmount(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Param('slotId', new ParseUUIDPipe({ version: '7' })) slotId: string,
    @RequestUser() user?: AuthenticatedUser,
  ): Promise<SlotAssignmentBoardResponseDto> {
    return this.allocationService.unmount(
      id,
      slotId,
      this.resolveActorId(user),
    );
  }

  @Put(':id/slot-assignments')
  @CheckPolicy('save', 'server-slot-allocations')
  @ApiOperation({
    summary:
      'Replace the server slot assignments (staged board save); omitted slots are emptied',
  })
  @ApiParam({ name: 'id', description: 'The physical server UUIDv7 id' })
  @ApiResponse({ status: 200, type: SlotAssignmentBoardResponseDto })
  @ApiResponse({
    status: 400,
    description:
      'A slot does not belong to the addressed server, or a slot/drive is listed more than once',
  })
  @ApiResponse({ status: 404, description: 'Server, slot or drive not found' })
  @ApiResponse({
    status: 409,
    description: 'A drive is not located in the server datacenter',
  })
  async saveAssignments(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Body() dto: SaveSlotAssignmentsDto,
    @RequestUser() user?: AuthenticatedUser,
  ): Promise<SlotAssignmentBoardResponseDto> {
    return this.allocationService.saveAssignments(
      id,
      dto.assignments,
      this.resolveActorId(user),
    );
  }

  private resolveActorId(user?: AuthenticatedUser): string {
    const actorId = user?.dbUser?.id ?? user?.id;
    if (!actorId) {
      throw new UnauthorizedException(
        'An authenticated operator is required to record slot assignments',
      );
    }
    return actorId;
  }
}
