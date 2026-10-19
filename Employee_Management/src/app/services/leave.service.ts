
import { Injectable } from '@angular/core';

export type LeaveDuration = 'Full Day' | 'Half Day';
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';

export interface LeaveRequest {
  id: number;
  employeeName: string;
  employeeEmail: string;
  department: string;
  leaveType: string;
  duration: LeaveDuration;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  appliedOn: string;
  reviewedBy?: string;
  reviewComment?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LeaveService {
  private readonly storageKey = 'employeeLeaveRequests';

  getRequests(): LeaveRequest[] {
    try {
      const saved = localStorage.getItem(this.storageKey);
      return saved ? JSON.parse(saved) as LeaveRequest[] : [];
    } catch {
      return [];
    }
  }

  addRequest(
    request: Omit<LeaveRequest, 'id' | 'status' | 'appliedOn'>
  ): void {
    const requests = this.getRequests();

    const newRequest: LeaveRequest = {
      ...request,
      id: requests.length
        ? Math.max(...requests.map(item => item.id)) + 1
        : 1,
      status: 'Pending',
      appliedOn: new Date().toISOString().slice(0, 10)
    };

    this.saveRequests([newRequest, ...requests]);
  }

  reviewRequest(
    id: number,
    status: 'Approved' | 'Rejected',
    reviewedBy: string,
    reviewComment: string
  ): void {
    const updatedRequests = this.getRequests().map(request =>
      request.id === id && request.status === 'Pending'
        ? { ...request, status, reviewedBy, reviewComment }
        : request
    );

    this.saveRequests(updatedRequests);
  }

  private saveRequests(requests: LeaveRequest[]): void {
    localStorage.setItem(
      this.storageKey,
      JSON.stringify(requests)
    );
  }
}