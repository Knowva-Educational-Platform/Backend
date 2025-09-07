import { Controller, Delete, Get, Param, Put, Req, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { AuthenticationGuard } from 'src/guards/authentication.guard';

@Controller('notification')
@UseGuards(AuthenticationGuard)
export class NotificationController {
    constructor(private readonly notificationService: NotificationService) {}

    @Put('mark-as-read')
    async markAllAsRead(@Req() req : any) {
        return await this.notificationService.markAllAsRead(+req.user.id);
    }

    @Get('unread-count')
    async getUnreadCount(@Req() req : any) {
        return this.notificationService.getUnreadCount(+req.user.id);
    }

    @Get('user-notifications')
    async getUserNotifications(@Req() req : any) {
        return this.notificationService.getUserNotifications(+req.user.id);
    }

    @Delete('delete-all')
    async deleteAll(@Req() req : any) {
        return this.notificationService.deleteAll(+req.user.id);
    }
}
