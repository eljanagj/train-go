import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiSecurity, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Notification } from './entities/notification.entity';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiSecurity('bearer')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get notifications for the current user' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns list of notifications for the current user',
    type: [Notification]
  })
  async findAll(@Request() req) {
    const isAdmin = req.user.roles?.includes('Admin');
    return this.notificationsService.findAll(req.user.sub, isAdmin);
  }

  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles('Admin')
  @ApiOperation({ summary: 'Get notifications for admin users' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns list of notifications for admin users',
    type: [Notification]
  })
  async findAllAdmin() {
    return this.notificationsService.findAllAdmin();
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiResponse({ 
    status: 200, 
    description: 'Notification marked as read successfully',
    type: Notification
  })
  async markAsRead(@Param('id') id: string, @Body('userId') userId: string) {
    return this.notificationsService.markAsRead(id, userId);
  }

  @Post('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read for a user' })
  @ApiResponse({ 
    status: 200, 
    description: 'All notifications marked as read successfully',
    type: Notification
  })
  async markAllAsRead(@Body('userId') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }
}
