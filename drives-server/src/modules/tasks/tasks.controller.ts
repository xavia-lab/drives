import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { KeycloakAuthGuard } from '../../common/guards/keycloak.guard';
import { CerbosGuard } from '../../common/guards/cerbos.guard';
import { CheckPolicy } from '../../common/decorators/check-policy.decorator';
import { RequestUser } from '../../common/decorators/request-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-request.interface';
import { TasksService, type BackgroundTaskView } from './tasks.service';

@ApiTags('system')
@Controller('tasks')
@UseGuards(KeycloakAuthGuard, CerbosGuard)
@ApiBearerAuth()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @CheckPolicy('list', 'tasks')
  @ApiOperation({
    summary: 'List background tasks with their last and next run times',
  })
  @ApiResponse({ status: 200, description: 'Tasks retrieved successfully' })
  getTasks(): Promise<BackgroundTaskView[]> {
    return this.tasksService.getTasks();
  }

  @Post(':key/run')
  @CheckPolicy('run', 'tasks')
  @ApiOperation({ summary: 'Manually trigger a background task' })
  @ApiParam({
    name: 'key',
    example: 'content-store-gc',
    description: 'Task key from GET /tasks',
  })
  @ApiResponse({ status: 200, description: 'Task triggered successfully' })
  @ApiResponse({ status: 400, description: 'Task is disabled' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async runTask(
    @Param('key') key: string,
    @RequestUser() user?: AuthenticatedUser,
  ): Promise<BackgroundTaskView> {
    const userId = user?.dbUser?.id ?? user?.id ?? null;
    return this.tasksService.runTask(key, userId);
  }
}
