import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { hostname } from 'os';
import {
  BackgroundTaskRun,
  BackgroundTaskRunStatus,
  BackgroundTaskTrigger,
} from './entities/background-task-run.entity';

export interface RunTaskOptions {
  userId?: string | null;
}

const STALE_RUN_GRACE_MS = 30 * 60 * 1000;

@Injectable()
export class TaskRunService implements OnModuleInit {
  private readonly logger = new Logger(TaskRunService.name);
  private readonly instanceId = (process.env.HOSTNAME ?? hostname()).slice(
    0,
    128,
  );

  constructor(
    @InjectModel(BackgroundTaskRun)
    private readonly taskRunModel: typeof BackgroundTaskRun,
  ) {}

  async onModuleInit(): Promise<void> {
    const stale = await this.taskRunModel.update(
      {
        status: BackgroundTaskRunStatus.FAILED,
        finishedAt: new Date(),
        errorMessage: 'Run did not complete before the process restarted',
      },
      {
        where: {
          status: BackgroundTaskRunStatus.RUNNING,
          startedAt: { [Op.lt]: new Date(Date.now() - STALE_RUN_GRACE_MS) },
        },
      },
    );

    if (Array.isArray(stale) && stale[0] > 0) {
      this.logger.warn(`Marked ${stale[0]} stale task run(s) as failed`);
    }
  }

  async run<T>(
    taskKey: string,
    triggerType: BackgroundTaskTrigger,
    work: () => Promise<T>,
    options: RunTaskOptions = {},
  ): Promise<T> {
    const startedAt = new Date();
    const startedMs = Date.now();
    const run = await this.taskRunModel.create({
      taskKey,
      triggerType,
      status: BackgroundTaskRunStatus.RUNNING,
      startedAt,
      triggeredByUserId: options.userId ?? null,
      instanceId: this.instanceId,
    });

    try {
      const result = await work();
      const status =
        result === null
          ? BackgroundTaskRunStatus.SKIPPED
          : BackgroundTaskRunStatus.SUCCEEDED;

      await run.update({
        status,
        finishedAt: new Date(),
        durationMs: Date.now() - startedMs,
        result:
          result === undefined
            ? null
            : ({ value: result } as Record<string, unknown>),
      });

      return result;
    } catch (error) {
      await run.update({
        status: BackgroundTaskRunStatus.FAILED,
        finishedAt: new Date(),
        durationMs: Date.now() - startedMs,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async getLatestRuns(
    taskKeys: string[],
  ): Promise<Map<string, BackgroundTaskRun>> {
    const latest = new Map<string, BackgroundTaskRun>();
    if (taskKeys.length === 0) return latest;

    const runs = await this.taskRunModel.findAll({
      where: { taskKey: { [Op.in]: taskKeys } },
      order: [
        ['taskKey', 'ASC'],
        ['startedAt', 'DESC'],
        ['displayKey', 'DESC'],
      ],
    });

    for (const run of runs) {
      if (!latest.has(run.taskKey)) {
        latest.set(run.taskKey, run);
      }
    }

    return latest;
  }
}
