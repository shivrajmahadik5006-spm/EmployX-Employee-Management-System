import {
  Component,
  OnInit,
  OnDestroy
} from '@angular/core';

import {
  CommonModule,
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
  PerformanceService,
  PerformanceReview as ApiPerformanceReview
} from '../services/performance.service';


interface PerformanceReviewUI {

  id: number;

  employeeId: number;

  employeeName: string;

  employeeEmail: string;

  department: string;

  reviewPeriod: string;

  rating: number;

  goals: string;

  achievements: string;

  feedback: string;

  reviewer: string;

  createdAt: string;
}


@Component({
  selector: 'app-performance',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    DatePipe
  ],

  templateUrl: './performance.html',

  styleUrl: './performance.css'
})
export class Performance
  implements OnInit, OnDestroy {


  // =====================================================
  // SUBSCRIPTIONS
  // =====================================================

  private employeeSubscription?: Subscription;

  private performanceSubscription?: Subscription;


  // =====================================================
  // USER
  // =====================================================

  currentRole = '';

  currentUserName = '';

  currentUserEmail = '';


  // =====================================================
  // DATA
  // =====================================================

  employees: Employee[] = [];

  reviews: PerformanceReviewUI[] = [];


  // =====================================================
  // SEARCH
  // =====================================================

  searchText = '';


  // =====================================================
  // FORM
  // =====================================================

  showForm = false;

  editingId: number | null = null;

  formEmployeeId = 0;

  formPeriod = '';

  formRating = 3;

  formGoals = '';

  formAchievements = '';

  formFeedback = '';


  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(
    private employeeService: EmployeeService,
    private performanceService: PerformanceService
  ) {}


  // =====================================================
  // INITIALIZATION
  // =====================================================

  ngOnInit(): void {

    this.loadCurrentUser();

    this.loadEmployees();

    this.loadPerformanceReviews();
  }


  // =====================================================
  // DESTROY
  // =====================================================

  ngOnDestroy(): void {

    this.employeeSubscription?.unsubscribe();

    this.performanceSubscription?.unsubscribe();
  }


  // =====================================================
  // CURRENT USER
  // =====================================================

  private loadCurrentUser(): void {

    let user: any = null;

    try {

      user = JSON.parse(
        localStorage.getItem('currentUser') || 'null'
      );

    } catch {

      user = null;
    }


    this.currentRole =
      String(user?.role || '').toLowerCase();


    this.currentUserName =
      user?.name ||
      user?.fullName ||
      'Reviewer';


    this.currentUserEmail =
      String(user?.email || '')
        .trim()
        .toLowerCase();
  }


  // =====================================================
  // LOAD EMPLOYEES
  // =====================================================

  private loadEmployees(): void {

  this.employeeSubscription?.unsubscribe();

  this.employeeSubscription =
    this.employeeService.getEmployees().subscribe({

      next: (employees: Employee[]) => {

        this.employees = employees;

        /*
         * If performance reviews were already loaded,
         * rebuild them with employee information.
         */
        if (this.reviews.length > 0) {
          this.rebuildReviews();
        }

      },

      error: (error) => {

        console.error(
          'Employee loading error:',
          error
        );

        this.employees = [];

      }

    });
}


  // =====================================================
  // REBUILD REVIEWS
  // =====================================================

  private rebuildReviews(): void {

    this.performanceSubscription?.unsubscribe();

    this.loadPerformanceReviews();
  }


  // =====================================================
  // ROLE
  // =====================================================

  get canManage(): boolean {

    return (
      this.currentRole === 'admin' ||
      this.currentRole === 'manager'
    );
  }


  // =====================================================
  // LOAD PERFORMANCE REVIEWS
  // =====================================================

  private loadPerformanceReviews(): void {

    this.performanceSubscription?.unsubscribe();

    this.performanceSubscription =
      this.performanceService
        .getPerformances()
        .subscribe({

          next: (data) => {

            this.reviews =
              data.map(
                review =>
                  this.convertApiToUi(review)
              );

            console.log(
              'Performance reviews:',
              this.reviews
            );
          },

          error: (error) => {

            console.error(
              'Performance API error:',
              error
            );

            this.reviews = [];

            alert(
              error?.error?.message ||
              'Unable to load performance reviews.'
            );
          }

        });
  }


  // =====================================================
  // CONVERT API DATA TO UI
  // =====================================================

  private convertApiToUi(
    review: ApiPerformanceReview
  ): PerformanceReviewUI {

    const employee =
      this.employees.find(
        item =>
          item.id === review.employeeId
      );


    return {

      id:
        review.id ?? 0,

      employeeId:
        review.employeeId,

      employeeName:
        review.employee?.name ||
        employee?.name ||
        'Unknown Employee',

      employeeEmail:
        review.employee?.email ||
        employee?.email ||
        '',

      department:
        this.getDepartmentName(employee),

      reviewPeriod:
        review.reviewPeriod || '',

      rating:
        review.rating,

      goals:
        review.areasForImprovement || '',

      achievements:
        review.strengths || '',

      feedback:
        review.comments || '',

      reviewer:
        review.reviewedBy || 'Reviewer',

      createdAt:
        review.reviewDate
    };
  }


  // =====================================================
  // GET DEPARTMENT NAME
  // =====================================================

  getDepartmentName(
    employee: Employee | undefined
  ): string {

    if (!employee) {

      return 'Not Assigned';
    }


    const department: any =
      employee.department;


    if (!department) {

      return 'Not Assigned';
    }


    if (
      typeof department === 'string'
    ) {

      return department;
    }


    return (
      department.name ||
      'Not Assigned'
    );
  }


  // =====================================================
  // VISIBLE REVIEWS
  // =====================================================

  get visibleReviews(): PerformanceReviewUI[] {

    let result =
      [...this.reviews];


    /*
     * Employee can see only their own reviews.
     */
    if (
      this.currentRole === 'employee'
    ) {

      result =
        result.filter(
          review =>
            review.employeeEmail
              .trim()
              .toLowerCase() ===
            this.currentUserEmail
        );
    }


    const search =
      this.searchText
        .trim()
        .toLowerCase();


    if (search) {

      result =
        result.filter(
          review =>

            review.employeeName
              .toLowerCase()
              .includes(search)

            ||

            review.department
              .toLowerCase()
              .includes(search)

            ||

            review.reviewPeriod
              .toLowerCase()
              .includes(search)

            ||

            review.reviewer
              .toLowerCase()
              .includes(search)
        );
    }


    return result.sort(
      (a, b) =>

        new Date(
          b.createdAt
        ).getTime()

        -

        new Date(
          a.createdAt
        ).getTime()
    );
  }


  // =====================================================
  // AVERAGE RATING
  // =====================================================

  get averageRating(): string {

    if (
      this.visibleReviews.length === 0
    ) {

      return '0.0';
    }


    const total =
      this.visibleReviews.reduce(
        (sum, review) =>
          sum + review.rating,
        0
      );


    return (
      total /
      this.visibleReviews.length
    ).toFixed(1);
  }


  // =====================================================
  // REVIEW COUNT
  // =====================================================

  get publishedCount(): number {

    return this.visibleReviews.length;
  }


  // =====================================================
  // DRAFT COUNT
  // =====================================================

  get draftCount(): number {

    /*
     * Backend does not currently have
     * Draft/Published status.
     */
    return 0;
  }


  // =====================================================
  // OPEN CREATE FORM
  // =====================================================

  openCreateForm(): void {

    if (!this.canManage) {

      return;
    }


    this.editingId = null;


    this.formEmployeeId =
      this.employees[0]?.id ?? 0;


    this.formPeriod = '';

    this.formRating = 3;

    this.formGoals = '';

    this.formAchievements = '';

    this.formFeedback = '';


    this.showForm = true;
  }


  // =====================================================
  // EDIT REVIEW
  // =====================================================

  editReview(
    review: PerformanceReviewUI
  ): void {

    if (!this.canManage) {

      return;
    }


    this.editingId =
      review.id;


    this.formEmployeeId =
      review.employeeId;


    this.formPeriod =
      review.reviewPeriod;


    this.formRating =
      review.rating;


    this.formGoals =
      review.goals;


    this.formAchievements =
      review.achievements;


    this.formFeedback =
      review.feedback;


    this.showForm = true;
  }


  // =====================================================
  // SAVE REVIEW
  // =====================================================

  saveReview(): void {

    if (!this.canManage) {

      return;
    }


    const employee =
      this.employees.find(
        item =>
          item.id ===
          Number(this.formEmployeeId)
      );


    if (!employee) {

      alert(
        'Please select an employee.'
      );

      return;
    }


    if (
      !this.formPeriod.trim()
    ) {

      alert(
        'Please enter the review period.'
      );

      return;
    }


    if (
      !this.formFeedback.trim()
    ) {

      alert(
        'Please enter reviewer feedback.'
      );

      return;
    }


    if (
      this.formRating < 1 ||
      this.formRating > 5
    ) {

      alert(
        'Rating must be between 1 and 5.'
      );

      return;
    }


    const request:
      ApiPerformanceReview = {

      employeeId:
        employee.id,

      rating:
        Number(this.formRating),

      strengths:
        this.formAchievements.trim(),

      areasForImprovement:
        this.formGoals.trim(),

      comments:
        this.formFeedback.trim(),

      reviewedBy:
        this.currentUserName.trim() ||
        'Reviewer',

      reviewPeriod:
        this.formPeriod.trim(),

      reviewDate:
        new Date().toISOString()
    };


    // ===================================================
    // UPDATE
    // ===================================================

    if (
      this.editingId !== null
    ) {

      this.performanceService
        .updatePerformance(
          this.editingId,
          request
        )
        .subscribe({

          next: () => {

            alert(
              'Performance review updated successfully.'
            );

            this.closeForm();

            this.loadPerformanceReviews();
          },

          error: (error) => {

            console.error(
              'Update performance error:',
              error
            );

            alert(
              error?.error?.message ||
              'Unable to update performance review.'
            );
          }

        });

      return;
    }


    // ===================================================
    // CREATE
    // ===================================================

    this.performanceService
      .createPerformance(request)
      .subscribe({

        next: () => {

          alert(
            'Performance review created successfully.'
          );

          this.closeForm();

          this.loadPerformanceReviews();
        },

        error: (error) => {

          console.error(
            'Create performance error:',
            error
          );

          alert(
            error?.error?.message ||
            'Unable to create performance review.'
          );
        }

      });
  }


  // =====================================================
  // DELETE REVIEW
  // =====================================================

  deleteReview(
    review: PerformanceReviewUI
  ): void {

    if (!this.canManage) {

      return;
    }


    if (
      !confirm(
        `Delete the review for ${review.employeeName}?`
      )
    ) {

      return;
    }


    this.performanceService
      .deletePerformance(
        review.id
      )
      .subscribe({

        next: () => {

          alert(
            'Performance review deleted successfully.'
          );


          this.reviews =
            this.reviews.filter(
              item =>
                item.id !== review.id
            );
        },

        error: (error) => {

          console.error(
            'Delete performance error:',
            error
          );

          alert(
            error?.error?.message ||
            'Unable to delete performance review.'
          );
        }

      });
  }


  // =====================================================
  // CLOSE FORM
  // =====================================================

  closeForm(): void {

    this.showForm = false;

    this.editingId = null;
  }

}