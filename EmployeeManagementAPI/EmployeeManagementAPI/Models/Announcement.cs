
using System.ComponentModel.DataAnnotations;

namespace EmployeeManagementAPI.Models;

public class Announcement
{
    public int Id { get; set; }

    [Required]
    [StringLength(150)]
    public string Title { get; set; } = string.Empty;

    [Required]
    public string Message { get; set; } = string.Empty;

    [Required]
    [StringLength(50)]
    public string Category { get; set; } = "General";

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public DateTime? ExpiryDate { get; set; }

    public bool IsActive { get; set; } = true;

    [StringLength(100)]
    public string? CreatedBy { get; set; }
}