import { Module } from '@nestjs/common';

import { BugProcessorController } from './bug-processor.controller';
import { BugProcessorService } from './bug-processor.service';
import { BugMonitorService } from './bug-monitor.service';

@Module({
  controllers: [BugProcessorController],
  providers: [BugProcessorService, BugMonitorService],
})
export class BugsModule {}
