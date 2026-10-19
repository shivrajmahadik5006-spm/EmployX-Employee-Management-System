
using System.ComponentModel.DataAnnotations;

namespace EmployeeManagementAPI.Models;

public class Attendance
{
    public int Id { get; set; }

    [Required]
    public int EmployeeId { get; set; }

    public DateTime Date { get; set; }

    public DateTime CheckIn { get; set; }

    public DateTime? CheckOut { get; set; }

    public Employee? Employee { get; set; }
}