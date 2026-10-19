import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { ManagedResourcesService } from './managed-resources.service';

@ApiTags('metadata')
@Controller('metadata')
export class MetadataController {
  constructor(
    private readonly managedResourcesService: ManagedResourcesService,
  ) {}

  @Public()
  @Get('managed-resources')
  @ApiOperation({
    summary:
      'Resource slugs whose Cerbos policy gates edit/delete on the managed attribute',
  })
  @ApiResponse({
    status: 200,
    description: 'Sorted list of managed resource slugs',
  })
  getManagedResources(): { resources: string[] } {
    return { resources: this.managedResourcesService.list() };
  }
}
