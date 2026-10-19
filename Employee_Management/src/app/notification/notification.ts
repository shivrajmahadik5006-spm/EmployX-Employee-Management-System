import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

import {
  NotificationItem,
  NotificationService,
  NotificationType
} from '../services/notification.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe
  ],
  templateUrl: './notification.html',
  styleUrl: './notification.css'
})
export class Notifications implements OnInit {

  notifications: NotificationItem[] = [];

  currentUserEmail = '';
  currentUserName = '';
  currentEmployeeId: number | null = null;

  activeFilter = 'All';

  filters = [
    'All',
    'Unread',
    'Task',
    'Leave',
    'Announcement',
    'Payroll',
    'General'
  ];


  constructor(
    private notificationService: NotificationService
  ) {}


  // ==========================================
  // INITIALIZE
  // ==========================================

  ngOnInit(): void {

    this.loadCurrentUser();

    this.loadNotifications();

  }


  // ==========================================
  // LOAD CURRENT USER
  // ==========================================

  private loadCurrentUser(): void {

    try {

      const user = JSON.parse(
        localStorage.getItem('currentUser') || 'null'
      );


      this.currentUserEmail =
        String(user?.email || '')
          .trim()
          .toLowerCase();


      this.currentUserName =
        String(
          user?.name ||
          user?.fullName ||
          'Employee'
        );


      // Try to get employeeId saved during login
      const employeeId =
        Number(user?.employeeId);


      if (employeeId > 0) {

        this.currentEmployeeId =
          employeeId;

      }

    } catch {

      this.currentUserEmail = '';

      this.currentUserName =
        'Employee';

      this.currentEmployeeId =
        null;

    }

  }


  // ==========================================
  // LOAD NOTIFICATIONS
  // ==========================================

  loadNotifications(): void {

    if (!this.currentEmployeeId) {

      this.notifications = [];

      console.error(
        'No employee ID found for logged-in user.'
      );

      console.log(
        'Current user:',
        this.currentUserEmail
      );

      return;
    }


    this.notificationService
      .getForEmployee(
        this.currentEmployeeId
      )
      .subscribe({

        next: (data) => {

          this.notifications =
            data || [];

          console.log(
            'Employee ID:',
            this.currentEmployeeId
          );

          console.log(
            'Notifications loaded from API:',
            this.notifications
          );

        },

        error: (error) => {

          console.error(
            'ERROR LOADING NOTIFICATIONS:',
            error
          );

          this.notifications = [];

        }

      });

  }


  // ==========================================
  // TEST NOTIFICATION
  // ==========================================

  addTestNotification(): void {

    if (!this.currentEmployeeId) {

      alert(
        'Employee ID not found. Please log in again.'
      );

      return;
    }


    this.notificationService
      .addNotification(

        this.currentEmployeeId,

        'Test Notification',

        'Your notification system is working correctly!',

        'General'

      )
      .subscribe({

        next: () => {

          this.activeFilter =
            'All';

          this.loadNotifications();

        },

        error: (error) => {

          console.error(
            'ERROR CREATING TEST NOTIFICATION:',
            error
          );

          alert(
            error.error?.message ||
            'Unable to create notification.'
          );

        }

      });

  }


  // ==========================================
  // FILTERED NOTIFICATIONS
  // ==========================================

  get filteredNotifications(): NotificationItem[] {

    if (
      this.activeFilter === 'All'
    ) {

      return this.notifications;

    }


    if (
      this.activeFilter === 'Unread'
    ) {

      return this.notifications.filter(
        item => !item.isRead
      );

    }


    return this.notifications.filter(
      item =>
        item.type ===
        this.activeFilter
    );

  }


  // ==========================================
  // UNREAD COUNT
  // ==========================================

  get unreadCount(): number {

    return this.notifications.filter(
      item => !item.isRead
    ).length;

  }


  // ==========================================
  // CHANGE FILTER
  // ==========================================

  setFilter(
    filter: string
  ): void {

    this.activeFilter =
      filter;

  }


  // ==========================================
  // MARK ONE AS READ
  // ==========================================

  markAsRead(
    item: NotificationItem
  ): void {

    if (!item.id) {
      return;
    }


    this.notificationService
      .markAsRead(
        item.id
      )
      .subscribe({

        next: () => {

          this.loadNotifications();

        },

        error: (error) => {

          console.error(
            'ERROR MARKING NOTIFICATION AS READ:',
            error
          );

        }

      });

  }


  // ==========================================
  // MARK ALL AS READ
  // ==========================================

  markAllAsRead(): void {

    const unread =
      this.notifications.filter(
        item => !item.isRead
      );


    if (
      unread.length === 0
    ) {

      return;

    }


    let completed = 0;


    unread.forEach(item => {

      if (!item.id) {

        completed++;

        return;

      }


      this.notificationService
        .markAsRead(item.id)
        .subscribe({

          next: () => {

            completed++;

            if (
              completed ===
              unread.length
            ) {

              this.loadNotifications();

            }

          },

          error: (error) => {

            console.error(
              `ERROR MARKING NOTIFICATION ${item.id} AS READ:`,
              error
            );

            completed++;

            if (
              completed ===
              unread.length
            ) {

              this.loadNotifications();

            }

          }

        });

    });

  }


  // ==========================================
  // DELETE NOTIFICATION
  // ==========================================

  deleteNotification(
    item: NotificationItem
  ): void {

    if (!item.id) {
      return;
    }


    this.notificationService
      .deleteNotification(
        item.id
      )
      .subscribe({

        next: () => {

          this.notifications =
            this.notifications.filter(
              notification =>
                notification.id !==
                item.id
            );

        },

        error: (error) => {

          console.error(
            'ERROR DELETING NOTIFICATION:',
            error
          );

          alert(
            error.error?.message ||
            'Unable to delete notification.'
          );

        }

      });

  }


  // ==========================================
  // CLEAR READ NOTIFICATIONS
  // ==========================================

  clearReadNotifications(): void {

    const readNotifications =
      this.notifications.filter(
        item => item.isRead
      );


    if (
      readNotifications.length === 0
    ) {

      return;

    }


    let completed = 0;


    readNotifications.forEach(item => {

      if (!item.id) {

        completed++;

        return;

      }


      this.notificationService
        .deleteNotification(
          item.id
        )
        .subscribe({

          next: () => {

            completed++;

            if (
              completed ===
              readNotifications.length
            ) {

              this.loadNotifications();

            }

          },

          error: (error) => {

            console.error(
              `ERROR DELETING READ NOTIFICATION ${item.id}:`,
              error
            );

            completed++;

            if (
              completed ===
              readNotifications.length
            ) {

              this.loadNotifications();

            }

          }

        });

    });

  }


  // ==========================================
  // ICON
  // ==========================================

  getIcon(
    type: NotificationType
  ): string {

    switch (type) {

      case 'Task':
        return '✓';

      case 'Leave':
        return '▣';

      case 'Announcement':
        return '📢';

      case 'Payroll':
        return '₹';

      default:
        return '●';

    }

  }

}