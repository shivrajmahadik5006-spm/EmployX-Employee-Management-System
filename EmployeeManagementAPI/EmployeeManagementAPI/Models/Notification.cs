
using System.ComponentModel.DataAnnotations;

namespace EmployeeManagementAPI.Models;

public class Notification
{
    public int Id { get; set; }

    [Required]
    public int EmployeeId { get; set; }

    public Employee? Employee { get; set; }

    [Required]
    [StringLength(150)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [StringLength(1000)]
    public string Message { get; set; } = string.Empty;

    [StringLength(50)]
    public string Type { get; set; } = "General";

    public bool IsRead { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public DateTime? ReadAt { get; set; }
}