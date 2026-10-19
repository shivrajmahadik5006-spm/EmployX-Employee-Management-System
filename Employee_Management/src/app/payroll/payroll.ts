import {
  Component,
  OnInit,
  OnDestroy
} from '@angular/core';

import {
  CommonModule,
  CurrencyPipe,
  DatePipe
} from '@angular/common';

import {
  FormsModule
} from '@angular/forms';

import {
  Subscription
} from 'rxjs';

import {
  Employee,
  EmployeeService
} from '../services/employee';

import {
  PayrollService,
  Payroll as PayrollApi
} from '../services/payroll.service';


interface PayrollRecord {

  id: number;

  employeeId: number;

  employeeName: string;

  email: string;

  department: string;

  basicSalary: number;

  allowances: number;

  pf: number;

  tax: number;

  otherDeductions: number;

  month: string;

  status: 'Pending' | 'Paid';

  generatedAt: string;

}


@Component({

  selector: 'app-payroll',

  standalone: true,

  imports: [

    CommonModule,

    FormsModule,

    CurrencyPipe,

    DatePipe

  ],

  templateUrl: './payroll.html',

  styleUrl: './payroll.css'

})


export class Payroll
  implements OnInit, OnDestroy {


  // ============================================================
  // CURRENT USER
  // ============================================================

  currentRole = '';

  currentEmail = '';

  currentEmployeeId: number | null = null;


  // ============================================================
  // PAYROLL
  // ============================================================

  selectedMonth =
    this.getCurrentMonth();

  payrollRecords:
    PayrollRecord[] = [];

  visibleRecords:
    PayrollRecord[] = [];


  // ============================================================
  // EMPLOYEES
  // ============================================================

  employees:
    Employee[] = [];


  // ============================================================
  // PAYSLIP
  // ============================================================

  selectedPayslip:
    PayrollRecord | null = null;


  // ============================================================
  // SEARCH
  // ============================================================

  searchText = '';


  // ============================================================
  // SUBSCRIPTION
  // ============================================================

  private employeeSubscription?:
    Subscription;


  // ============================================================
  // CONSTRUCTOR
  // ============================================================

  constructor(

    private employeeService:
      EmployeeService,

    private payrollService:
      PayrollService

  ) {}


  // ============================================================
  // ROLE CHECKS
  // ============================================================

  get isAdmin(): boolean {

    return this.currentRole === 'admin';

  }


  get isManager(): boolean {

    return this.currentRole === 'manager';

  }


  get canManagePayroll(): boolean {

    return (
      this.isAdmin ||
      this.isManager
    );

  }


  // ============================================================
  // TOTAL PAYROLL
  // ============================================================

  get totalPayroll(): number {

    return this.visibleRecords.reduce(

      (sum, record) =>
        sum + this.netSalary(record),

      0

    );

  }


  // ============================================================
  // PAID COUNT
  // ============================================================

  get paidCount(): number {

    return this.visibleRecords.filter(

      record =>
        record.status === 'Paid'

    ).length;

  }


  // ============================================================
  // PENDING COUNT
  // ============================================================

  get pendingCount(): number {

    return this.visibleRecords.filter(

      record =>
        record.status === 'Pending'

    ).length;

  }


  // ============================================================
  // INIT
  // ============================================================

  ngOnInit(): void {

  console.log(
    'Payroll component started.'
  );

  this.loadCurrentUser();

  this.employeeSubscription =
    this.employeeService
      .getEmployees()
      .subscribe({

        next: (
          employees: Employee[]
        ) => {

          this.employees =
            employees;

          this.findCurrentEmployee();

          this.loadPayroll();

        },

        error: (error: any) => {

          console.error(
            'Unable to load employees:',
            error
          );

        }

      });

}

  // ============================================================
  // LOAD CURRENT USER
  // ============================================================

  private loadCurrentUser(): void {

    let user: any = null;


    try {

      user = JSON.parse(

        localStorage.getItem(
          'currentUser'
        ) || 'null'

      );

    }

    catch {

      user = null;

    }


    this.currentRole =

      String(
        user?.role || ''
      )
        .trim()
        .toLowerCase();


    this.currentEmail =

      String(
        user?.email || ''
      )
        .trim()
        .toLowerCase();


    console.log(
      'Payroll current user:',
      user
    );


    console.log(
      'Payroll role:',
      this.currentRole
    );


    console.log(
      'Payroll email:',
      this.currentEmail
    );

  }


  // ============================================================
  // FIND CURRENT EMPLOYEE
  // ============================================================

  private findCurrentEmployee(): void {

    if (!this.currentEmail) {

      this.currentEmployeeId =
        null;

      return;

    }


    const employee =

      this.employees.find(

        (item: Employee) =>

          String(
            item.email || ''
          )
            .trim()
            .toLowerCase() ===
          this.currentEmail

      );


    if (employee) {

      this.currentEmployeeId =
        employee.id;


      console.log(
        'Current employee:',
        employee
      );

    }

    else {

      this.currentEmployeeId =
        null;


      console.warn(
        'Employee record not found for:',
        this.currentEmail
      );

    }

  }


  // ============================================================
  // CURRENT MONTH
  // ============================================================

  private getCurrentMonth(): string {

    const now =
      new Date();


    const year =
      now.getFullYear();


    const month =
      String(
        now.getMonth() + 1
      ).padStart(
        2,
        '0'
      );


    return `${year}-${month}`;

  }


  // ============================================================
  // LOAD PAYROLL
  // ============================================================

  private loadPayroll(): void {

    console.log(
      'Loading payroll from API...'
    );


    // ----------------------------------------------------------
    // ADMIN / MANAGER
    // ----------------------------------------------------------

    if (
      this.isAdmin ||
      this.isManager
    ) {

      this.payrollService
        .getAllPayroll()
        .subscribe({

          next:
            (
              payrolls: PayrollApi[]
            ) => {

              console.log(
                'Payroll records from API:',
                payrolls
              );


              this.payrollRecords =

                payrolls.map(

                  payroll =>

                    this.convertApiPayroll(
                      payroll
                    )

                );


              this.refreshVisibleRecords();

            },


          error:
            (error) => {

              console.error(
                'PAYROLL API ERROR:',
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


              this.payrollRecords =
                [];


              this.refreshVisibleRecords();

            }

        });


      return;

    }


    // ----------------------------------------------------------
    // EMPLOYEE
    // ----------------------------------------------------------

    if (!this.currentEmployeeId) {

      this.payrollRecords =
        [];

      this.refreshVisibleRecords();

      return;

    }


    this.payrollService

      .getPayrollByEmployee(
        this.currentEmployeeId
      )

      .subscribe({

        next:
          (
            payrolls: PayrollApi[]
          ) => {

            console.log(
              'My payroll records:',
              payrolls
            );


            this.payrollRecords =

              payrolls.map(

                payroll =>

                  this.convertApiPayroll(
                    payroll
                  )

              );


            this.refreshVisibleRecords();

          },


        error:
          (error) => {

            console.error(
              'MY PAYROLL API ERROR:',
              error
            );


            this.payrollRecords =
              [];


            this.refreshVisibleRecords();

          }

      });

  }


  // ============================================================
  // CONVERT API PAYROLL
  // ============================================================

  private convertApiPayroll(
    payroll: PayrollApi
  ): PayrollRecord {

    const employee =

      this.employees.find(

        item =>
          item.id ===
          payroll.employeeId

      );


    const departmentName =

      employee?.department?.name ||
      'Not Assigned';


    const paymentStatus =

      String(
        payroll.paymentStatus ||
        'Pending'
      )
        .trim()
        .toLowerCase();


    return {

      id:
        payroll.id,

      employeeId:
        payroll.employeeId,

      employeeName:

        payroll.employeeName ||
        employee?.name ||
        'Unknown Employee',

      email:
        employee?.email || '',

      department:
        departmentName,

      basicSalary:

        Number(
          payroll.basicSalary
        ) || 0,

      allowances:

        Number(
          payroll.allowances
        ) || 0,

      pf:
        0,

      tax:
        0,

      otherDeductions:

        Number(
          payroll.deductions
        ) || 0,

      month:

        `${payroll.year}-${String(
          payroll.month
        ).padStart(
          2,
          '0'
        )}`,

      status:

        paymentStatus === 'paid'
          ? 'Paid'
          : 'Pending',

      generatedAt:
        payroll.generatedAt

    };

  }


  // ============================================================
  // CHANGE MONTH
  // ============================================================

  changeMonth(): void {

    this.selectedPayslip =
      null;


    this.refreshVisibleRecords();


    console.log(
      'Selected payroll month:',
      this.selectedMonth
    );

  }


  // ============================================================
  // FILTER PAYROLL
  // ============================================================

  refreshVisibleRecords(): void {

    const parts =

      this.selectedMonth.split('-');


    const selectedYear =
      Number(parts[0]);


    const selectedMonthNumber =
      Number(parts[1]);


    let records =

      this.payrollRecords.filter(

        record => {

          const recordParts =
            record.month.split('-');


          const recordYear =
            Number(
              recordParts[0]
            );


          const recordMonth =
            Number(
              recordParts[1]
            );


          return (

            recordYear ===
              selectedYear

            &&

            recordMonth ===
              selectedMonthNumber

          );

        }

      );


    // ----------------------------------------------------------
    // EMPLOYEE CAN SEE ONLY OWN PAYROLL
    // ----------------------------------------------------------

    if (
      !this.isAdmin &&
      !this.isManager
    ) {

      records =

        records.filter(

          record =>

            record.email
              .trim()
              .toLowerCase() ===
            this.currentEmail

        );

    }


    // ----------------------------------------------------------
    // SEARCH
    // ----------------------------------------------------------

    const term =

      this.searchText
        .trim()
        .toLowerCase();


    this.visibleRecords =

      records.filter(

        record => {

          if (!term) {

            return true;

          }


          return (

            record.employeeName
              .toLowerCase()
              .includes(term)

            ||

            record.department
              .toLowerCase()
              .includes(term)

            ||

            record.email
              .toLowerCase()
              .includes(term)

          );

        }

      );


    console.log(
      'Selected month:',
      this.selectedMonth
    );


    console.log(
      'Visible payroll records:',
      this.visibleRecords
    );

  }


  // ============================================================
  // GROSS SALARY
  // ============================================================

  grossSalary(
    record: PayrollRecord
  ): number {

    return (

      Number(
        record.basicSalary || 0
      )

      +

      Number(
        record.allowances || 0
      )

    );

  }


  // ============================================================
  // TOTAL DEDUCTIONS
  // ============================================================

  totalDeductions(
    record: PayrollRecord
  ): number {

    return (

      Number(
        record.pf || 0
      )

      +

      Number(
        record.tax || 0
      )

      +

      Number(
        record.otherDeductions || 0
      )

    );

  }


  // ============================================================
  // NET SALARY
  // ============================================================

  netSalary(
    record: PayrollRecord
  ): number {

    return Math.max(

      0,

      this.grossSalary(record)
      -
      this.totalDeductions(record)

    );

  }


  // ============================================================
  // SAVE PAYROLL
  // ============================================================

  saveRecord(
    record: PayrollRecord
  ): void {

    if (!this.canManagePayroll) {

      return;

    }


    const monthParts =
      record.month.split('-');


    const request = {

      employeeId:
        record.employeeId,

      month:
        Number(monthParts[1]),

      year:
        Number(monthParts[0]),

      allowances:

        Math.max(
          0,
          Number(
            record.allowances
          ) || 0
        ),

      deductions:

        Math.max(
          0,
          Number(
            this.totalDeductions(record)
          ) || 0
        )

    };


    console.log(
      'Saving payroll:',
      request
    );


    if (record.id > 0) {

      this.payrollService

        .updatePayroll(
          record.id,
          request
        )

        .subscribe({

          next: () => {

            console.log(
              'Payroll updated successfully.'
            );


            this.loadPayroll();


            alert(
              'Payroll updated successfully.'
            );

          },


          error:
            (error) => {

              console.error(
                'UPDATE PAYROLL ERROR:',
                error
              );


              alert(

                error.error?.message ||

                'Unable to update payroll.'

              );

            }

        });


      return;

    }


    this.payrollService

      .createPayroll(request)

      .subscribe({

        next:
          (payroll: PayrollApi) => {

            console.log(
              'Payroll created:',
              payroll
            );


            this.loadPayroll();


            alert(
              'Payroll created successfully.'
            );

          },


        error:
          (error) => {

            console.error(
              'CREATE PAYROLL ERROR:',
              error
            );


            alert(

              error.error?.message ||

              'Unable to create payroll.'

            );

          }

      });

  }


  // ============================================================
  // MARK AS PAID
  // ============================================================

  markAsPaid(
    record: PayrollRecord
  ): void {

    // ----------------------------------------------------------
    // Permission
    // ----------------------------------------------------------

    if (!this.canManagePayroll) {

      return;

    }


    // ----------------------------------------------------------
    // Already paid
    // ----------------------------------------------------------

    if (record.status === 'Paid') {

      return;

    }


    // ----------------------------------------------------------
    // Confirmation
    // ----------------------------------------------------------

    const confirmed =

      confirm(

        `Mark payroll for ${record.employeeName} as Paid?`

      );


    if (!confirmed) {

      return;

    }


    console.log(
      'Marking payroll as Paid.'
    );


    console.log(
      'Payroll ID:',
      record.id
    );


    // ----------------------------------------------------------
    // CALL BACKEND
    // ----------------------------------------------------------

    this.payrollService

      .markPayrollAsPaid(
        record.id
      )

      .subscribe({

        next:
          (response) => {

            console.log(
              'Mark Paid API response:',
              response
            );


            // --------------------------------------------------
            // Update current row immediately
            // --------------------------------------------------

            record.status =
              'Paid';


            // --------------------------------------------------
            // Refresh current table
            // --------------------------------------------------

            this.refreshVisibleRecords();


            // --------------------------------------------------
            // IMPORTANT
            //
            // Reload from database.
            // This guarantees that after browser refresh
            // the saved status is used.
            // --------------------------------------------------

            this.loadPayroll();


            alert(
              'Payroll marked as Paid successfully.'
            );

          },


        error:
          (error) => {

            console.error(
              'MARK PAID ERROR:',
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


            alert(

              error.error?.message ||

              'Unable to mark payroll as Paid.'

            );

          }

      });

  }


  // ============================================================
  // GENERATE PAYROLL
  // ============================================================

  generatePayroll(): void {

    if (!this.canManagePayroll) {

      return;

    }


    const parts =
      this.selectedMonth.split('-');


    const year =
      Number(parts[0]);


    const month =
      Number(parts[1]);


    if (!month || !year) {

      alert(
        'Please select a valid payroll month.'
      );

      return;

    }


    const confirmed =

      confirm(

        `Generate payroll for ${this.selectedMonth}?`

      );


    if (!confirmed) {

      return;

    }


    const request = {

      month:
        month,

      year:
        year,

      allowances:
        0,

      deductions:
        0

    };


    console.log(
      'Generating payroll:',
      request
    );


    this.payrollService

      .generatePayroll(request)

      .subscribe({

        next:
          (response) => {

            console.log(
              'Generate payroll response:',
              response
            );


            alert(

              response?.message ||

              `Payroll generated for ${this.selectedMonth}.`

            );


            this.loadPayroll();

          },


        error:
          (error) => {

            console.error(
              'GENERATE PAYROLL ERROR:',
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


            alert(

              error.error?.message ||

              'Unable to generate payroll.'

            );

          }

      });

  }


  // ============================================================
  // VIEW PAYSLIP
  // ============================================================

  viewPayslip(
    record: PayrollRecord
  ): void {

    if (

      !this.isAdmin &&

      !this.isManager &&

      record.email
        .trim()
        .toLowerCase() !==
      this.currentEmail

    ) {

      return;

    }


    this.selectedPayslip =
      record;

  }


  // ============================================================
  // CLOSE PAYSLIP
  // ============================================================

  closePayslip(): void {

    this.selectedPayslip =
      null;

  }


  // ============================================================
  // PRINT PAYSLIP
  // ============================================================

  printPayslip(): void {

    window.print();

  }


  // ============================================================
  // DELETE PAYROLL
  // ============================================================

  deletePayroll(
    record: PayrollRecord
  ): void {

    if (!this.canManagePayroll) {

      return;

    }


    const confirmed =

      confirm(

        `Are you sure you want to delete payroll for ${record.employeeName}?`

      );


    if (!confirmed) {

      return;

    }


    this.payrollService

      .deletePayroll(
        record.id
      )

      .subscribe({

        next: () => {

          console.log(
            'Payroll deleted successfully.'
          );


          this.loadPayroll();


          alert(
            'Payroll deleted successfully.'
          );

        },


        error:
          (error) => {

            console.error(
              'DELETE PAYROLL ERROR:',
              error
            );


            alert(

              error.error?.message ||

              'Unable to delete payroll.'

            );

          }

      });

  }


  // ============================================================
  // DESTROY
  // ============================================================

  ngOnDestroy(): void {

    this.employeeSubscription
      ?.unsubscribe();

  }

}