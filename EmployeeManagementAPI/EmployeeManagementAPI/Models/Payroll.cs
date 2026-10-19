using System.ComponentModel.DataAnnotations;

namespace EmployeeManagementAPI.Models;

public class Payroll
{
    public int Id { get; set; }

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

    public decimal NetSalary { get; set; }

    [Required]
    [MaxLength(20)]
    public string PaymentStatus { get; set; } = "Pending";

    public DateTime GeneratedAt { get; set; } = DateTime.Now;

    public Employee? Employee { get; set; }
}