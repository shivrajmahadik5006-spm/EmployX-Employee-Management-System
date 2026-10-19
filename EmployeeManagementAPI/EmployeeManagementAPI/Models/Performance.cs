using System.ComponentModel.DataAnnotations;

namespace EmployeeManagementAPI.Models;

public class Performance
{
    public int Id { get; set; }

    [Required]
    public int EmployeeId { get; set; }

    [Required]
    [Range(1, 5)]
    public int Rating { get; set; }

    [MaxLength(1000)]
    public string Strengths { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string AreasForImprovement { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Comments { get; set; }

    [Required]
    [MaxLength(100)]
    public string ReviewedBy { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string ReviewPeriod { get; set; } = string.Empty;

    public DateTime ReviewDate { get; set; } = DateTime.Now;

    public Employee? Employee { get; set; }
}