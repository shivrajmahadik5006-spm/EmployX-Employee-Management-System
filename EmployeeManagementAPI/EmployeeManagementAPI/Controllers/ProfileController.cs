
using System.Security.Claims;
using EmployeeManagementAPI.Data;
using EmployeeManagementAPI.Models;
using EmployeeManagementAPI.Models.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagementAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProfileController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ApplicationDbContext _context;

        public ProfileController(
            UserManager<ApplicationUser> userManager,
            ApplicationDbContext context)
        {
            _userManager = userManager;
            _context = context;
        }

        // GET: api/Profile
        [HttpGet]
        public async Task<IActionResult> GetProfile()
        {
            var userId = User.FindFirstValue(
                ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var user = await _userManager.FindByIdAsync(userId);

            if (user == null)
                return NotFound(new
                {
                    message = "User account not found."
                });

            var roles = await _userManager.GetRolesAsync(user);

            Employee? employee = null;

            if (user.EmployeeId.HasValue)
            {
                employee = await _context.Employees
                    .Include(e => e.Department)
                    .FirstOrDefaultAsync(
                        e => e.Id == user.EmployeeId.Value);
            }

            return Ok(new
            {
                userId = user.Id,
                fullName = user.FullName,
                email = user.Email,
                phoneNumber = user.PhoneNumber,
                roles = roles,

                employee = employee == null ? null : new
                {
                    employeeId = employee.Id,
                    name = employee.Name,
                    phone = employee.Phone,
                    department = employee.Department?.Name,
                    position = employee.Position,
                    status = employee.Status,
                    joiningDate = employee.JoiningDate
                }
            });
        }

        // PUT: api/Profile
        [HttpPut]
        public async Task<IActionResult> UpdateProfile(
            ProfileUpdateRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = User.FindFirstValue(
                ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var user = await _userManager.FindByIdAsync(userId);

            if (user == null)
                return NotFound(new
                {
                    message = "User account not found."
                });

            user.FullName = request.FullName.Trim();
            user.PhoneNumber = string.IsNullOrWhiteSpace(
                request.PhoneNumber)
                ? null
                : request.PhoneNumber.Trim();

            var result = await _userManager.UpdateAsync(user);

            if (!result.Succeeded)
            {
                return BadRequest(new
                {
                    errors = result.Errors.Select(
                        e => e.Description)
                });
            }

            // Update the linked employee's name and phone,
            // if this account is linked to an employee record.
            if (user.EmployeeId.HasValue)
            {
                var employee = await _context.Employees
                    .FirstOrDefaultAsync(
                        e => e.Id == user.EmployeeId.Value);

                if (employee != null)
                {
                    employee.Name = user.FullName;
                    employee.Phone = user.PhoneNumber ?? string.Empty;

                    await _context.SaveChangesAsync();
                }
            }

            return Ok(new
            {
                message = "Profile updated successfully.",
                fullName = user.FullName,
                email = user.Email,
                phoneNumber = user.PhoneNumber
            });
        }
    }
}