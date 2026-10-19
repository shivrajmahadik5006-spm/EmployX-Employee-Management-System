using EmployeeManagementAPI.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagementAPI.Data
{
    public class ApplicationDbContext
        : IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(
            DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        // ============================================================
        // Employee Management
        // ============================================================

        public DbSet<Employee> Employees => Set<Employee>();

        public DbSet<Department> Departments => Set<Department>();


        // ============================================================
        // Attendance
        // ============================================================

        public DbSet<Attendance> Attendances => Set<Attendance>();


        // ============================================================
        // Leave Management
        // ============================================================

        public DbSet<LeaveRequest> LeaveRequests => Set<LeaveRequest>();


        // ============================================================
        // Payroll
        // ============================================================

        public DbSet<Payroll> Payrolls => Set<Payroll>();


        // ============================================================
        // Announcements
        // ============================================================

        public DbSet<Announcement> Announcements { get; set; }


        // ============================================================
        // Performance
        // ============================================================

        public DbSet<Performance> Performances { get; set; }


        // ============================================================
        // Tasks
        // ============================================================

        public DbSet<TaskItem> Tasks { get; set; }


        // ============================================================
        // Notifications
        // ============================================================

        public DbSet<Notification> Notifications { get; set; }


        // ============================================================
        // DATABASE CONFIGURATION
        // ============================================================

        protected override void OnModelCreating(
            ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);


            // ========================================================
            // EMPLOYEE → DEPARTMENT
            // ========================================================

            modelBuilder.Entity<Employee>()
                .HasOne(e => e.Department)
                .WithMany(d => d.Employees)
                .HasForeignKey(e => e.DepartmentId)
                .OnDelete(DeleteBehavior.Restrict);


            // ========================================================
            // EMPLOYEE SALARY PRECISION
            // ========================================================

            modelBuilder.Entity<Employee>()
                .Property(e => e.Salary)
                .HasPrecision(18, 2);


            // ========================================================
            // DEPARTMENT BUDGET PRECISION
            // ========================================================

            modelBuilder.Entity<Department>()
                .Property(d => d.Budget)
                .HasPrecision(18, 2);


            // ========================================================
            // ATTENDANCE → EMPLOYEE
            // ========================================================

            modelBuilder.Entity<Attendance>()
                .HasOne(a => a.Employee)
                .WithMany()
                .HasForeignKey(a => a.EmployeeId)
                .OnDelete(DeleteBehavior.Restrict);


            // ========================================================
            // PAYROLL → EMPLOYEE
            // ========================================================

            modelBuilder.Entity<Payroll>()
                .HasOne(p => p.Employee)
                .WithMany()
                .HasForeignKey(p => p.EmployeeId)
                .OnDelete(DeleteBehavior.Restrict);

            // ========================================================
            // PERFORMANCE → EMPLOYEE
            // ========================================================

            modelBuilder.Entity<Performance>()
                .HasOne(p => p.Employee)
                .WithMany()
                .HasForeignKey(p => p.EmployeeId)
                .OnDelete(DeleteBehavior.Restrict);


            // ========================================================
            // PAYROLL MONEY PRECISION
            // ========================================================

            modelBuilder.Entity<Payroll>()
                .Property(p => p.BasicSalary)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Payroll>()
                .Property(p => p.Allowances)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Payroll>()
                .Property(p => p.Deductions)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Payroll>()
                .Property(p => p.NetSalary)
                .HasPrecision(18, 2);


            // ========================================================
            // PAYROLL PAYMENT STATUS
            // ========================================================

            modelBuilder.Entity<Payroll>()
                .Property(p => p.PaymentStatus)
                .HasMaxLength(20)
                .HasDefaultValue("Pending");


            // ========================================================
            // TASK → ASSIGNED EMPLOYEE
            // ========================================================

            modelBuilder.Entity<TaskItem>()
                .HasOne(t => t.AssignedToEmployee)
                .WithMany()
                .HasForeignKey(t => t.AssignedToEmployeeId)
                .OnDelete(DeleteBehavior.NoAction);


            // ========================================================
            // TASK → ASSIGNED BY EMPLOYEE
            // ========================================================

            modelBuilder.Entity<TaskItem>()
                .HasOne(t => t.AssignedByEmployee)
                .WithMany()
                .HasForeignKey(t => t.AssignedByEmployeeId)
                .OnDelete(DeleteBehavior.NoAction);


            // ========================================================
            // APPLICATION USER → EMPLOYEE
            // ========================================================

            modelBuilder.Entity<ApplicationUser>()
                .HasOne(u => u.Employee)
                .WithMany()
                .HasForeignKey(u => u.EmployeeId)
                .OnDelete(DeleteBehavior.NoAction);
        }
    }
}