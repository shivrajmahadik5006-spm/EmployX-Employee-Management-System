using System.ComponentModel.DataAnnotations;

namespace EmployeeManagementAPI.DTOs.Payroll;

public class PayrollRequest
{
    [Required]
    public int EmployeeId { get; set; }

    [Range(1, 12)]
    public int Month { get; set; }

    [Range(2000, 2100)]
    public int Year { get; set; }

    [Range(0, double.MaxValue)]
    public decimal BasicSalary { get; set; }

    [Range(0, double.MaxValue)]
    public decimal Allowances { get; set; }

    [Range(0, double.MaxValue)]
    public decimal Deductions { get; set; }
}