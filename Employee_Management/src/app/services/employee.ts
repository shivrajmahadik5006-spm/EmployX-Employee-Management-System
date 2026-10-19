import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


export interface Department {
  id: number;
  name: string;
  description?: string;
  manager?: string;
  employeeCount?: number;
  budget?: number;
}


export interface Employee {
  id: number;
  name: string;
  email: string;
  phone: string;
  position: string;
  salary: number;
  joiningDate: string;
  status: string;
  departmentId: number;

  department?: Department;
}


export interface EmployeeForm {
  name: string;
  email: string;
  phone: string;
  position: string;
  salary: number;
  joiningDate: string;
  status: string;
  departmentId: number;

  password?: string;
  confirmPassword?: string;
}


@Injectable({
  providedIn: 'root'
})
export class EmployeeService {

  private readonly apiUrl =
    'https://localhost:7246/api/Employees';


  constructor(
    private http: HttpClient
  ) {}


  // GET ALL EMPLOYEES
  getEmployees(): Observable<Employee[]> {

    return this.http.get<Employee[]>(
      this.apiUrl
    );

  }


  // GET ONE EMPLOYEE
  getEmployee(
    id: number
  ): Observable<Employee> {

    return this.http.get<Employee>(
      `${this.apiUrl}/${id}`
    );

  }


  // ADD EMPLOYEE
  addEmployee(
    employee: EmployeeForm
  ): Observable<any> {

    return this.http.post<any>(
      this.apiUrl,
      employee
    );

  }


  // CREATE EMPLOYEE
  createEmployee(
    employee: EmployeeForm
  ): Observable<any> {

    return this.http.post<any>(
      this.apiUrl,
      employee
    );

  }


  // UPDATE EMPLOYEE
  updateEmployee(
    id: number,
    employee: Partial<Employee>
  ): Observable<Employee> {

    return this.http.put<Employee>(
      `${this.apiUrl}/${id}`,
      employee
    );

  }


  // DELETE EMPLOYEE
  deleteEmployee(
    id: number
  ): Observable<any> {

    return this.http.delete<any>(
      `${this.apiUrl}/${id}`
    );

  }

}