import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AttendanceRecord {
  id: number;
  employeeId: number;
  date: string;
  checkIn: string;
  checkOut: string | null;

  employee?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface AttendanceRequest {
  employeeId: number;
}

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {

  private apiUrl =
    'https://localhost:7246/api/Attendance';

  constructor(
    private http: HttpClient
  ) {}

  // Get all attendance records
  getAllRecords(): Observable<AttendanceRecord[]> {
    return this.http.get<AttendanceRecord[]>(
      this.apiUrl
    );
  }

  // Get attendance records for one employee
  getRecordsForEmployee(
    employeeId: number
  ): Observable<AttendanceRecord[]> {
    return this.http.get<AttendanceRecord[]>(
      `${this.apiUrl}/employee/${employeeId}`
    );
  }

  // Get today's attendance for one employee
  getTodayRecord(
    employeeId: number
  ): Observable<AttendanceRecord> {
    return this.http.get<AttendanceRecord>(
      `${this.apiUrl}/today/${employeeId}`
    );
  }

  // Employee checks in
  checkIn(
    employeeId: number
  ): Observable<AttendanceRecord> {

    const request: AttendanceRequest = {
      employeeId: employeeId
    };

    return this.http.post<AttendanceRecord>(
      `${this.apiUrl}/check-in`,
      request
    );
  }

  // Employee checks out
  checkOut(
    employeeId: number
  ): Observable<AttendanceRecord> {

    const request: AttendanceRequest = {
      employeeId: employeeId
    };

    return this.http.post<AttendanceRecord>(
      `${this.apiUrl}/check-out`,
      request
    );
  }

  // Delete attendance record
  deleteAttendance(
    id: number
  ): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${id}`
    );
  }
}