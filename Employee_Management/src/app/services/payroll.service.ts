import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Payroll {
  id: number;
  employeeId: number;
  employeeName: string;
  month: number;
  year: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  paymentStatus: string;
  generatedAt: string;
}

export interface CreatePayrollRequest {
  employeeId: number;
  month: number;
  year: number;
  allowances: number;
  deductions: number;
}

export interface GeneratePayrollRequest {
  month: number;
  year: number;
  allowances: number;
  deductions: number;
}

@Injectable({
  providedIn: 'root'
})
export class PayrollService {

  private apiUrl =
    'https://localhost:7246/api/Payrolls';

  constructor(
    private http: HttpClient
  ) {}

  // ============================================================
  // GET ALL PAYROLL
  // ============================================================

  getAllPayroll(): Observable<Payroll[]> {

    return this.http.get<Payroll[]>(
      this.apiUrl
    );

  }


  // ============================================================
  // GET PAYROLL BY ID
  // ============================================================

  getPayrollById(
    id: number
  ): Observable<Payroll> {

    return this.http.get<Payroll>(
      `${this.apiUrl}/${id}`
    );

  }


  // ============================================================
  // GET PAYROLL BY EMPLOYEE
  // ============================================================

  getPayrollByEmployee(
    employeeId: number
  ): Observable<Payroll[]> {

    return this.http.get<Payroll[]>(
      `${this.apiUrl}/employee/${employeeId}`
    );

  }


  // ============================================================
  // CREATE PAYROLL
  // ============================================================

  createPayroll(
    request: CreatePayrollRequest
  ): Observable<Payroll> {

    return this.http.post<Payroll>(
      this.apiUrl,
      request
    );

  }


  // ============================================================
  // UPDATE PAYROLL
  // ============================================================

  updatePayroll(
    id: number,
    request: CreatePayrollRequest
  ): Observable<void> {

    return this.http.put<void>(
      `${this.apiUrl}/${id}`,
      request
    );

  }


  // ============================================================
  // MARK PAYROLL AS PAID
  // ============================================================

  markPayrollAsPaid(
    id: number
  ): Observable<any> {

    console.log(
      'Calling Mark Paid API for Payroll ID:',
      id
    );

    return this.http.put(
      `${this.apiUrl}/${id}/pay`,
      {}
    );

  }


  // ============================================================
  // GENERATE PAYROLL
  // ============================================================

  generatePayroll(
    request: GeneratePayrollRequest
  ): Observable<any> {

    return this.http.post(
      `${this.apiUrl}/generate`,
      request
    );

  }


  // ============================================================
  // DELETE PAYROLL
  // ============================================================

  deletePayroll(
    id: number
  ): Observable<void> {

    return this.http.delete<void>(
      `${this.apiUrl}/${id}`
    );

  }

}