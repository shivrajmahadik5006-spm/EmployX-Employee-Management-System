using System.ComponentModel.DataAnnotations;

namespace EmployeeManagementAPI.DTOs.Employees
{
    public class CreateEmployeeRequest
    {
        [Required]
        public string Name { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        public string Phone { get; set; } = string.Empty;

        [Required]
        public string Position { get; set; } = string.Empty;

        public decimal Salary { get; set; }

        public DateTime JoiningDate { get; set; }

        public string Status { get; set; } = "Active";

        [Required]
        public int DepartmentId { get; set; }

        [Required]
        [MinLength(6)]
        public string Password { get; set; } = string.Empty;

        [Required]
        [Compare(nameof(Password))]
        public string ConfirmPassword { get; set; } = string.Empty;
    }
}