export class CreateNotificationDto {
  message: string;
  userId?: string;
  isAdminNotification: boolean;
  readBy: string[];
} 