
namespace EmployeeManagementAPI.Models;

public class Employee
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;

    public string Position { get; set; } = string.Empty;

    public decimal Salary { get; set; }

    public DateTime JoiningDate { get; set; }

    public string Status { get; set; } = "Active";

    public int DepartmentId { get; set; }

    public Department? Department { get; set; }
}