
using System.ComponentModel.DataAnnotations;

namespace EmployeeManagementAPI.Models;

public class LeaveRequest
{
    public int Id { get; set; }

    [Required]
    public int EmployeeId { get; set; }

    [Required]
    public DateTime LeaveDate { get; set; }

    // Full Day or Half Day
    [Required]
    [MaxLength(20)]
    public string LeaveType { get; set; } = "Full Day";

    [Required]
    [MaxLength(500)]
    public string Reason { get; set; } = string.Empty;

    // Pending, Approved, or Rejected
    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "Pending";

    public DateTime RequestedAt { get; set; } = DateTime.Now;

    public DateTime? ReviewedAt { get; set; }

    public Employee? Employee { get; set; }
}