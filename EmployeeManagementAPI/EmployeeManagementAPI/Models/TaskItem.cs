using System.ComponentModel.DataAnnotations;

namespace EmployeeManagementAPI.Models;

public class TaskItem
{
    public int Id { get; set; }

    [Required]
    [StringLength(150)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [StringLength(2000)]
    public string Description { get; set; } = string.Empty;

    [Required]
    public int AssignedToEmployeeId { get; set; }

    public Employee? AssignedToEmployee { get; set; }

    // Optional because Manager/Admin may not have an Employee profile
    public int? AssignedByEmployeeId { get; set; }

    public Employee? AssignedByEmployee { get; set; }

    [StringLength(20)]
    public string Priority { get; set; } = "Medium";

    [StringLength(30)]
    public string Status { get; set; } = "Pending";

    public DateTime DueDate { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public DateTime? CompletedAt { get; set; }
}