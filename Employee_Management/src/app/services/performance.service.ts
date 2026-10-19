import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PerformanceReview {
  id?: number;
  employeeId: number;
  rating: number;
  strengths: string;
  areasForImprovement: string;
  comments: string;
  reviewedBy: string;
  reviewPeriod: string;
  reviewDate: string;

  employee?: {
    id: number;
    name: string;
    email: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PerformanceService {

  private readonly apiUrl =
    'https://localhost:7246/api/Performances';


  constructor(
    private http: HttpClient
  ) {}


  getPerformances():
    Observable<PerformanceReview[]> {

    return this.http.get<PerformanceReview[]>(
      this.apiUrl
    );
  }


  getPerformance(
    id: number
  ): Observable<PerformanceReview> {

    return this.http.get<PerformanceReview>(
      `${this.apiUrl}/${id}`
    );
  }


  getByEmployee(
    employeeId: number
  ): Observable<PerformanceReview[]> {

    return this.http.get<PerformanceReview[]>(
      `${this.apiUrl}/employee/${employeeId}`
    );
  }


  createPerformance(
    performance: PerformanceReview
  ): Observable<PerformanceReview> {

    return this.http.post<PerformanceReview>(
      this.apiUrl,
      performance
    );
  }


  updatePerformance(
    id: number,
    performance: PerformanceReview
  ): Observable<PerformanceReview> {

    return this.http.put<PerformanceReview>(
      `${this.apiUrl}/${id}`,
      performance
    );
  }


  deletePerformance(
    id: number
  ): Observable<void> {

    return this.http.delete<void>(
      `${this.apiUrl}/${id}`
    );
  }

}