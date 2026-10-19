using System.ComponentModel.DataAnnotations;

namespace EmployeeManagementAPI.DTOs.Departments
{
    public class DepartmentRequest
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(100)]
        public string Manager { get; set; } = string.Empty;

        public decimal Budget { get; set; }
    }
}