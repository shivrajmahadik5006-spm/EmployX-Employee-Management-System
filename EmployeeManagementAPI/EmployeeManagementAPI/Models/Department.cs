using System.ComponentModel.DataAnnotations;

namespace EmployeeManagementAPI.Models
{
    public class Department
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(100)]
        public string Manager { get; set; } = string.Empty;

        public decimal Budget { get; set; }

        public ICollection<Employee> Employees { get; set; }
            = new List<Employee>();
    }
}