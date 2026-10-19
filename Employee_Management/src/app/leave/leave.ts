
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LeaveService,
  LeaveRequest,
  LeaveDuration
} from '../services/leave.service';

type UserRole = 'admin' | 'manager' | 'employee';

@Component({
  selector: 'app-leave',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './leave.html',
  styleUrl: './leave.css'
})
export class Leave implements OnInit {
  currentUser = {
    name: '',
    email: '',
    role: 'employee' as UserRole
  };

  isReviewer = false;

  requests: LeaveRequest[] = [];
  myRequests: LeaveRequest[] = [];

  leaveType = 'Casual Leave';
  duration: LeaveDuration = 'Full Day';
  startDate = '';
  endDate = '';
  reason = '';

  reviewComments: Record<number, string> = {};

  successMessage = '';
  errorMessage = '';

  today = new Date().toLocaleDateString('en-CA');

  constructor(private leaveService: LeaveService) {}

  ngOnInit(): void {
    this.loadUser();
    this.refreshRequests();
  }
private loadUser(): void {
  const savedUser = localStorage.getItem('currentUser');

  if (!savedUser) {
    console.error('No logged-in user found in localStorage.');
    this.errorMessage = 'Please log in again.';
    return;
  }

  try {
    const user = JSON.parse(savedUser);

    const normalizedRole = ((user.role || 'employee') as string)
      .toLowerCase() as UserRole;

    this.currentUser = {
      name: user.name || 'User',
      email: (user.email || '').toLowerCase(),
      role: normalizedRole
    };

    this.isReviewer =
      this.currentUser.role === 'admin' ||
      this.currentUser.role === 'manager';

  } catch (error) {
    console.error('Unable to read currentUser:', error);
    this.errorMessage = 'Unable to load your account. Please log in again.';
  }
}

  refreshRequests(): void {
    this.requests = this.leaveService.getRequests();

    this.myRequests = this.requests.filter(request =>
      request.employeeEmail.toLowerCase() ===
      this.currentUser.email.toLowerCase()
    );
  }

  get visibleRequests(): LeaveRequest[] {
    return this.isReviewer
      ? this.requests
      : this.myRequests;
  }

  get pendingCount(): number {
    return this.myRequests.filter(
      request => request.status === 'Pending'
    ).length;
  }

  get approvedCount(): number {
    return this.myRequests.filter(
      request => request.status === 'Approved'
    ).length;
  }

  get rejectedCount(): number {
    return this.myRequests.filter(
      request => request.status === 'Rejected'
    ).length;
  }

  get pendingReviewCount(): number {
    return this.requests.filter(
      request => request.status === 'Pending'
    ).length;
  }

  calculateDays(): number {
    if (
      !this.startDate ||
      !this.endDate ||
      this.endDate < this.startDate
    ) {
      return 0;
    }

    if (this.duration === 'Half Day') {
      return 0.5;
    }

    const start = new Date(this.startDate + 'T00:00:00');
    const end = new Date(this.endDate + 'T00:00:00');

    const difference = Math.round(
      (end.getTime() - start.getTime()) / 86400000
    );

    return difference + 1;
  }

  onDurationChange(): void {
    if (this.duration === 'Half Day' && this.startDate) {
      this.endDate = this.startDate;
    }
  }

  onStartDateChange(): void {
    if (this.duration === 'Half Day') {
      this.endDate = this.startDate;
    } else if (
      this.endDate &&
      this.endDate < this.startDate
    ) {
      this.endDate = this.startDate;
    }
  }

  submitLeave(): void {
    this.successMessage = '';
    this.errorMessage = '';

    if (!this.currentUser.email) {
      this.errorMessage = 'Please log in again before applying.';
      return;
    }

    if (
      !this.startDate ||
      !this.endDate ||
      !this.reason.trim()
    ) {
      this.errorMessage = 'Please fill in all required fields.';
      return;
    }

    if (this.startDate < this.today) {
      this.errorMessage = 'Leave cannot start in the past.';
      return;
    }

    if (this.endDate < this.startDate) {
      this.errorMessage =
        'End date cannot be before start date.';
      return;
    }

    if (
      this.duration === 'Half Day' &&
      this.startDate !== this.endDate
    ) {
      this.errorMessage =
        'Half-day leave must be for one date.';
      return;
    }

    const overlapping = this.myRequests.some(request =>
      request.status !== 'Rejected' &&
      this.startDate <= request.endDate &&
      this.endDate >= request.startDate
    );

    if (overlapping) {
      this.errorMessage =
        'You already have a pending or approved request for these dates.';
      return;
    }

    this.leaveService.addRequest({
      employeeName: this.currentUser.name,
      employeeEmail: this.currentUser.email,
      department: 'Not specified',
      leaveType: this.leaveType,
      duration: this.duration,
      startDate: this.startDate,
      endDate: this.endDate,
      days: this.calculateDays(),
      reason: this.reason.trim()
    });

    this.refreshRequests();

    this.successMessage =
      'Leave application submitted successfully!';

    this.leaveType = 'Casual Leave';
    this.duration = 'Full Day';
    this.startDate = '';
    this.endDate = '';
    this.reason = '';
  }

  reviewLeave(
    request: LeaveRequest,
    status: 'Approved' | 'Rejected'
  ): void {
    this.successMessage = '';
    this.errorMessage = '';

    if (!this.isReviewer) {
      this.errorMessage =
        'You are not allowed to review requests.';
      return;
    }

    if (request.status !== 'Pending') {
      this.errorMessage =
        'This request has already been reviewed.';
      return;
    }

    const comment =
      (this.reviewComments[request.id] || '').trim();

    this.leaveService.reviewRequest(
      request.id,
      status,
      this.currentUser.name,
      comment
    );

    this.refreshRequests();

    this.successMessage =
      `Leave request ${status.toLowerCase()} successfully.`;
  }
}