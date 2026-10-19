
using System.ComponentModel.DataAnnotations;

namespace EmployeeManagementAPI.Models.DTOs
{
    public class ProfileUpdateRequest
    {
        [Required]
        [StringLength(100)]
        public string FullName { get; set; } = string.Empty;

        [Phone]
        public string? PhoneNumber { get; set; }
    }
}