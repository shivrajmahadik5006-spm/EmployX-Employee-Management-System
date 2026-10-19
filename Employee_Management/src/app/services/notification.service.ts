import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type NotificationType =
  'Task' |
  'Leave' |
  'Announcement' |
  'Payroll' |
  'General';

export interface NotificationItem {
  id?: number;

  employeeId: number;

  title: string;

  message: string;

  type: NotificationType;

  isRead: boolean;

  createdAt: string;

  readAt?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private readonly apiUrl =
    'https://localhost:7246/api/Notifications';

  constructor(
    private http: HttpClient
  ) {}

  getAll(): Observable<NotificationItem[]> {
    return this.http.get<NotificationItem[]>(
      this.apiUrl
    );
  }

  getForEmployee(
    employeeId: number
  ): Observable<NotificationItem[]> {
    return this.http.get<NotificationItem[]>(
      `${this.apiUrl}/employee/${employeeId}`
    );
  }

  addNotification(
    employeeId: number,
    title: string,
    message: string,
    type: NotificationType = 'General'
  ): Observable<NotificationItem> {

    const notification: NotificationItem = {
      employeeId: employeeId,
      title: title.trim(),
      message: message.trim(),
      type: type,
      isRead: false,
      createdAt: new Date().toISOString(),
      readAt: null
    };

    return this.http.post<NotificationItem>(
      this.apiUrl,
      notification
    );
  }

  markAsRead(
    id: number
  ): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/${id}/read`,
      {}
    );
  }

  deleteNotification(
    id: number
  ): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/${id}`
    );
  }
}