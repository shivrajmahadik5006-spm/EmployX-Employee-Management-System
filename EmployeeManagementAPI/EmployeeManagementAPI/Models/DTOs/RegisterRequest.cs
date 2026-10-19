
using System.ComponentModel.DataAnnotations;

namespace EmployeeManagementAPI.Models.DTOs
{
    public class RegisterRequest
    {
        [Required]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MinLength(8)]
        public string Password { get; set; } = string.Empty;

        // Public registration can create Employee accounts only.
        public int? EmployeeId { get; set; }
    }
}