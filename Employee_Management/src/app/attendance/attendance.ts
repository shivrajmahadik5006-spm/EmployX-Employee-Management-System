import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  AttendanceService,
  AttendanceRecord
} from '../services/attendance.service';

import {
  Employee,
  EmployeeService
} from '../services/employee';

import {
  Subscription
} from 'rxjs';


@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './attendance.html',
  styleUrl: './attendance.css'
})
export class Attendance
  implements OnInit, OnDestroy {

  // ==================================================
  // BASIC DATA
  // ==================================================

  todayDate = new Date();

  userName = '';

  userEmail = '';

  userRole = '';

  employeeId: number | null = null;


  // ==================================================
  // ATTENDANCE DATA
  // ==================================================

  todayRecord:
    AttendanceRecord | undefined;

  records:
    AttendanceRecord[] = [];

  managerRecords:
    AttendanceRecord[] = [];


  // ==================================================
  // MESSAGES / LOADING
  // ==================================================

  message = '';

  errorMessage = '';

  isLoading = false;


  // ==================================================
  // TIMER
  // ==================================================

  private timerId:
    ReturnType<typeof setInterval> | undefined;


  // ==================================================
  // SUBSCRIPTION
  // ==================================================

  private employeeSubscription?:
    Subscription;


  // ==================================================
  // CONSTRUCTOR
  // ==================================================

  constructor(
    private attendanceService:
      AttendanceService,

    private employeeService:
      EmployeeService,

    private cdr:
      ChangeDetectorRef
  ) {}


  // ==================================================
  // INITIALIZATION
  // ==================================================

  ngOnInit(): void {

    this.loadUser();

    /*
     * MANAGER / ADMIN
     *
     * They can see all employee attendance.
     */
    if (
      this.userRole === 'manager' ||
      this.userRole === 'admin'
    ) {

      this.loadManagerAttendance();

    } else {

      /*
       * EMPLOYEE
       *
       * Find their employee record
       * and load their own attendance.
       */
      this.findEmployee();

    }

    /*
     * Keep today's date/time updated.
     */
    this.timerId =
      setInterval(() => {

        this.todayDate =
          new Date();

      }, 1000);
  }


  // ==================================================
  // DESTROY
  // ==================================================

  ngOnDestroy(): void {

    if (
      this.timerId !== undefined
    ) {

      clearInterval(
        this.timerId
      );
    }

    this.employeeSubscription
      ?.unsubscribe();
  }


  // ==================================================
  // LOAD LOGGED-IN USER
  // ==================================================

  loadUser(): void {

    try {

      const user =
        JSON.parse(
          localStorage.getItem(
            'currentUser'
          ) || 'null'
        );

      this.userName =
        user?.name ||
        user?.fullName ||
        '';

      this.userEmail =
        user?.email ||
        '';

      this.userRole =
        String(
          user?.role || ''
        ).toLowerCase();

      console.log(
        'Logged-in user:',
        user
      );

      console.log(
        'User role:',
        this.userRole
      );

    } catch {

      this.userName = '';

      this.userEmail = '';

      this.userRole = '';
    }
  }


  // ==================================================
  // FIND EMPLOYEE
  // ==================================================

  findEmployee(): void {

    if (!this.userEmail) {

      return;
    }

    /*
     * EmployeeService now returns
     * Observable<Employee[]> through
     * getEmployees().
     */
    this.employeeSubscription =
      this.employeeService
        .getEmployees()
        .subscribe({

          next:
            (
              employees: Employee[]
            ) => {

              const employee =
                employees.find(
                  (item: Employee) =>
                    String(
                      item.email || ''
                    )
                      .trim()
                      .toLowerCase() ===
                    this.userEmail
                      .trim()
                      .toLowerCase()
                );

              if (employee) {

                this.employeeId =
                  employee.id;

                this.userName =
                  employee.name;

                console.log(
                  'Employee found:',
                  employee
                );

                this.refreshAttendance();

              } else {

                this.employeeId =
                  null;

                this.todayRecord =
                  undefined;

                this.records = [];

                console.error(
                  'Employee record not found for:',
                  this.userEmail
                );

                this.errorMessage =
                  'Employee account could not be found.';
              }
            },

          error:
            (error: any) => {

              console.error(
                'Unable to find employee:',
                error
              );

              this.errorMessage =
                'Unable to load employee information.';
            }

        });
  }


  // ==================================================
  // LOAD ALL ATTENDANCE
  // MANAGER / ADMIN
  // ==================================================

  loadManagerAttendance(): void {

    this.isLoading = true;

    this.errorMessage = '';

    console.log(
      'Loading all employee attendance...'
    );

    this.attendanceService
      .getAllRecords()
      .subscribe({

        next:
          (
            records: AttendanceRecord[]
          ) => {

            console.log(
              'ALL ATTENDANCE RECORDS:',
              records
            );

            /*
             * Create a new array so Angular
             * detects the data change.
             */
            this.managerRecords =
              [...records];

            console.log(
              'MANAGER RECORDS AFTER ASSIGNMENT:',
              this.managerRecords
            );

            console.log(
              'MANAGER RECORD COUNT:',
              this.managerRecords.length
            );

            this.isLoading = false;

            /*
             * Force Angular to update
             * the attendance table.
             */
            this.cdr.detectChanges();
          },

        error:
          (error: any) => {

            console.error(
              'ERROR LOADING ALL ATTENDANCE:',
              error
            );

            console.error(
              'Status:',
              error.status
            );

            console.error(
              'Response:',
              error.error
            );

            this.managerRecords = [];

            this.isLoading = false;

            this.errorMessage =
              error.error?.message ||
              'Unable to load employee attendance.';

            this.cdr.detectChanges();
          }

      });
  }


  // ==================================================
  // REFRESH ATTENDANCE
  // ==================================================

  refreshAttendance(): void {

    // ================================================
    // MANAGER / ADMIN
    // ================================================

    if (
      this.userRole === 'manager' ||
      this.userRole === 'admin'
    ) {

      this.loadManagerAttendance();

      return;
    }


    // ================================================
    // EMPLOYEE
    // ================================================

    if (!this.employeeId) {

      this.todayRecord =
        undefined;

      this.records = [];

      return;
    }


    // ================================================
    // LOAD TODAY'S ATTENDANCE
    // ================================================

    this.attendanceService
      .getTodayRecord(
        this.employeeId
      )
      .subscribe({

        next:
          (
            record: AttendanceRecord
          ) => {

            this.todayRecord =
              record;

            this.cdr.detectChanges();
          },

        error:
          (error: any) => {

            if (
              error.status === 404
            ) {

              this.todayRecord =
                undefined;

            } else {

              console.error(
                'Error loading today attendance:',
                error
              );
            }

            this.cdr.detectChanges();
          }

      });


    // ================================================
    // LOAD EMPLOYEE ATTENDANCE HISTORY
    // ================================================

    this.attendanceService
      .getRecordsForEmployee(
        this.employeeId
      )
      .subscribe({

        next:
          (
            records: AttendanceRecord[]
          ) => {

            this.records =
              [...records];

            this.cdr.detectChanges();
          },

        error:
          (error: any) => {

            console.error(
              'Error loading attendance history:',
              error
            );

            this.records = [];

            this.cdr.detectChanges();
          }

      });
  }


  // ==================================================
  // ATTENDANCE HISTORY
  // ==================================================

  get attendanceHistoryRecords():
    AttendanceRecord[] {

    /*
     * Manager/Admin:
     * Show ALL employee attendance.
     */
    if (
      this.userRole === 'manager' ||
      this.userRole === 'admin'
    ) {

      return this.managerRecords;
    }

    /*
     * Employee:
     * Show only their attendance.
     */
    return this.records;
  }


  // ==================================================
  // TODAY'S STATUS
  // ==================================================

  get attendanceStatus(): string {

    if (!this.todayRecord) {

      return 'Not Checked In';
    }

    return this.todayRecord.checkOut
      ? 'Checked Out'
      : 'Checked In';
  }


  // ==================================================
  // CALCULATE MINUTES
  // ==================================================

  private calculateMinutes(
    checkIn: string,
    checkOut: string | null
  ): number {

    const start =
      new Date(
        checkIn
      ).getTime();

    const end =
      checkOut
        ? new Date(
            checkOut
          ).getTime()
        : Date.now();

    if (
      !Number.isFinite(start) ||
      !Number.isFinite(end)
    ) {

      return 0;
    }

    return Math.max(
      0,
      Math.floor(
        (
          end - start
        ) / 60000
      )
    );
  }


  // ==================================================
  // FORMAT DURATION
  // ==================================================

  formatDuration(
    totalMinutes: number
  ): string {

    const hours =
      Math.floor(
        totalMinutes / 60
      );

    const minutes =
      totalMinutes % 60;

    return (
      `${hours}h ` +
      `${String(minutes).padStart(2, '0')}m`
    );
  }


  // ==================================================
  // EMPLOYEE WORKING DURATION
  // ==================================================

  get workingDuration(): string {

    if (!this.todayRecord) {

      return '0h 00m';
    }

    return this.formatDuration(
      this.calculateMinutes(
        this.todayRecord.checkIn,
        this.todayRecord.checkOut
      )
    );
  }


  // ==================================================
  // RECORD WORKING DURATION
  // ==================================================

  getRecordDuration(
    record: AttendanceRecord
  ): string {

    return this.formatDuration(
      this.calculateMinutes(
        record.checkIn,
        record.checkOut
      )
    );
  }


  // ==================================================
  // MANAGER WORKING DURATION
  // ==================================================

  getManagerDuration(
    record: AttendanceRecord
  ): string {

    return this.getRecordDuration(
      record
    );
  }


  // ==================================================
  // FORMAT TIME
  // ==================================================

  formatTime(
    value: string | null
  ): string {

    if (!value) {

      return '--';
    }

    return new Date(
      value
    ).toLocaleTimeString(
      [],
      {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }
    );
  }


  // ==================================================
  // CHECK IN
  // ==================================================

  checkIn(): void {

    this.message = '';

    this.errorMessage = '';

    // --------------------------------
    // Only Employee can check in
    // --------------------------------

    if (
      this.userRole !== 'employee'
    ) {

      this.errorMessage =
        'Only employee accounts can check in.';

      return;
    }


    // --------------------------------
    // Employee ID validation
    // --------------------------------

    if (!this.employeeId) {

      this.errorMessage =
        'Employee account could not be found.';

      return;
    }

    this.isLoading = true;


    // --------------------------------
    // Call API
    // --------------------------------

    this.attendanceService
      .checkIn(
        this.employeeId
      )
      .subscribe({

        next:
          (
            record: AttendanceRecord
          ) => {

            this.todayRecord =
              record;

            this.message =
              'Check-in successful!';

            this.isLoading = false;

            this.cdr.detectChanges();

            /*
             * Reload attendance history.
             */
            this.refreshAttendance();
          },

        error:
          (error: any) => {

            console.error(
              'CHECK-IN API ERROR:',
              error
            );

            console.log(
              'Status:',
              error.status
            );

            console.log(
              'Response body:',
              error.error
            );

            console.log(
              'Response message:',
              error.error?.message
            );

            this.isLoading = false;

            this.errorMessage =
              error.error?.message ||
              'Unable to check in.';

            this.cdr.detectChanges();
          }

      });
  }


  // ==================================================
  // CHECK OUT
  // ==================================================

  checkOut(): void {

    this.message = '';

    this.errorMessage = '';


    // --------------------------------
    // Only Employee can check out
    // --------------------------------

    if (
      this.userRole !== 'employee'
    ) {

      this.errorMessage =
        'Only employee accounts can check out.';

      return;
    }


    // --------------------------------
    // Employee ID validation
    // --------------------------------

    if (!this.employeeId) {

      this.errorMessage =
        'Employee account could not be found.';

      return;
    }

    this.isLoading = true;


    // --------------------------------
    // Call API
    // --------------------------------

    this.attendanceService
      .checkOut(
        this.employeeId
      )
      .subscribe({

        next:
          (
            record: AttendanceRecord
          ) => {

            this.todayRecord =
              record;

            this.message =
              'Check-out successful!';

            this.isLoading = false;

            this.cdr.detectChanges();

            /*
             * Reload attendance history.
             */
            this.refreshAttendance();
          },

        error:
          (error: any) => {

            console.error(
              'CHECK-OUT ERROR:',
              error
            );

            console.log(
              'Status:',
              error.status
            );

            console.log(
              'Response:',
              error.error
            );

            this.isLoading = false;

            this.errorMessage =
              error.error?.message ||
              'Unable to check out.';

            this.cdr.detectChanges();
          }

      });
  }

}