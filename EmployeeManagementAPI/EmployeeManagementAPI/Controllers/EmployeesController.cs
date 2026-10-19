
using EmployeeManagementAPI.Data;
using EmployeeManagementAPI.DTOs.Employees;
using EmployeeManagementAPI.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagementAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EmployeesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public EmployeesController(
            ApplicationDbContext context,
            UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        // GET: api/Employees
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Employee>>> GetEmployees()
        {
            var employees = await _context.Employees
                .Include(e => e.Department)
                .AsNoTracking()
                .ToListAsync();

            return Ok(employees);
        }

        // GET: api/Employees/5
        [HttpGet("{id:int}")]
        public async Task<ActionResult<Employee>> GetEmployee(int id)
        {
            var employee = await _context.Employees
                .Include(e => e.Department)
                .AsNoTracking()
                .FirstOrDefaultAsync(e => e.Id == id);

            if (employee == null)
            {
                return NotFound(new
                {
                    message = "Employee not found."
                });
            }

            return Ok(employee);
        }

        // POST: api/Employees
        // Creates employee, login account and Employee role.
        [HttpPost]
        public async Task<ActionResult> CreateEmployee(
            CreateEmployeeRequest request)
        {
            if (request == null)
            {
                return BadRequest(new
                {
                    message = "Employee details are required."
                });
            }

            var department = await _context.Departments
                .FirstOrDefaultAsync(d => d.Id == request.DepartmentId);

            if (department == null)
            {
                return BadRequest(new
                {
                    message = "Selected department does not exist."
                });
            }

            if (string.IsNullOrWhiteSpace(request.Name) ||
                string.IsNullOrWhiteSpace(request.Email) ||
                string.IsNullOrWhiteSpace(request.Position))
            {
                return BadRequest(new
                {
                    message = "Name, email and position are required."
                });
            }

            if (string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new
                {
                    message = "Password is required."
                });
            }

            if (request.Password.Length < 6)
            {
                return BadRequest(new
                {
                    message = "Password must contain at least 6 characters."
                });
            }

            if (request.Password != request.ConfirmPassword)
            {
                return BadRequest(new
                {
                    message = "Password and Confirm Password do not match."
                });
            }

            string email = request.Email.Trim();

            var employeeExists = await _context.Employees
                .AnyAsync(e => e.Email.ToLower() == email.ToLower());

            if (employeeExists)
            {
                return Conflict(new
                {
                    message = "An employee with this email already exists."
                });
            }

            var userExists = await _userManager.FindByEmailAsync(email);

            if (userExists != null)
            {
                return Conflict(new
                {
                    message = "A login account with this email already exists."
                });
            }

            var employee = new Employee
            {
                Name = request.Name.Trim(),
                Email = email,
                Phone = request.Phone?.Trim() ?? string.Empty,
                Position = request.Position.Trim(),
                Salary = request.Salary,
                JoiningDate = request.JoiningDate,
                Status = string.IsNullOrWhiteSpace(request.Status)
                    ? "Active"
                    : request.Status.Trim(),
                DepartmentId = request.DepartmentId
            };

            _context.Employees.Add(employee);
            await _context.SaveChangesAsync();

            var user = new ApplicationUser
            {
                UserName = email,
                Email = email,
                FullName = request.Name.Trim(),
                EmployeeId = employee.Id,
                EmailConfirmed = true
            };

            var createUserResult = await _userManager.CreateAsync(
                user,
                request.Password);

            if (!createUserResult.Succeeded)
            {
                _context.Employees.Remove(employee);
                await _context.SaveChangesAsync();

                return BadRequest(new
                {
                    message = "Employee login account could not be created.",
                    errors = createUserResult.Errors
                        .Select(e => e.Description)
                        .ToList()
                });
            }

            var roleResult = await _userManager.AddToRoleAsync(
                user,
                "Employee");

            if (!roleResult.Succeeded)
            {
                await _userManager.DeleteAsync(user);

                _context.Employees.Remove(employee);
                await _context.SaveChangesAsync();

                return BadRequest(new
                {
                    message = "Employee role could not be assigned.",
                    errors = roleResult.Errors
                        .Select(e => e.Description)
                        .ToList()
                });
            }

            var createdEmployee = await _context.Employees
                .Include(e => e.Department)
                .AsNoTracking()
                .FirstAsync(e => e.Id == employee.Id);

            return CreatedAtAction(
                nameof(GetEmployee),
                new { id = createdEmployee.Id },
                new
                {
                    message = "Employee and login account created successfully.",
                    employee = createdEmployee,
                    login = new
                    {
                        email = email,
                        role = "Employee"
                    }
                });
        }

        // PUT: api/Employees/5
        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateEmployee(
            int id,
            Employee updatedEmployee)
        {
            if (id != updatedEmployee.Id)
            {
                return BadRequest(new
                {
                    message = "Employee ID in the URL and body must match."
                });
            }

            if (updatedEmployee.DepartmentId <= 0)
            {
                return BadRequest(new
                {
                    message = "A valid DepartmentId is required."
                });
            }

            var employee = await _context.Employees.FindAsync(id);

            if (employee == null)
            {
                return NotFound(new
                {
                    message = "Employee not found."
                });
            }

            var departmentExists = await _context.Departments
                .AnyAsync(d => d.Id == updatedEmployee.DepartmentId);

            if (!departmentExists)
            {
                return BadRequest(new
                {
                    message = "Department does not exist."
                });
            }

            employee.Name = updatedEmployee.Name;
            employee.Email = updatedEmployee.Email;
            employee.Phone = updatedEmployee.Phone;
            employee.Position = updatedEmployee.Position;
            employee.Salary = updatedEmployee.Salary;
            employee.JoiningDate = updatedEmployee.JoiningDate;
            employee.Status = updatedEmployee.Status;
            employee.DepartmentId = updatedEmployee.DepartmentId;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex)
            {
                Console.Error.WriteLine(ex.ToString());

                return StatusCode(500, new
                {
                    message = "Database error while updating employee."
                });
            }

            return NoContent();
        }

        // DELETE: api/Employees/5
        // Soft delete: marks employee inactive and preserves history.
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteEmployee(int id)
        {
            try
            {
                var employee = await _context.Employees
                    .FirstOrDefaultAsync(e => e.Id == id);

                if (employee == null)
                {
                    return NotFound(new
                    {
                        message = "Employee not found."
                    });
                }

                employee.Status = "Inactive";

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Employee marked as inactive successfully.",
                    employeeId = employee.Id,
                    status = employee.Status
                });
            }
            catch (DbUpdateException ex)
            {
                Console.Error.WriteLine(ex.ToString());

                return StatusCode(500, new
                {
                    message = "Unable to update employee status."
                });
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine(ex.ToString());

                return StatusCode(500, new
                {
                    message = "An unexpected error occurred."
                });
            }
        }
    }
}
