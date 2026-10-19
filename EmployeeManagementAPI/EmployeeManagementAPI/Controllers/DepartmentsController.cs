using EmployeeManagementAPI.Data;
using EmployeeManagementAPI.DTOs.Departments;
using EmployeeManagementAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagementAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DepartmentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public DepartmentsController(
            ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Departments
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetDepartments()
        {
            var departments = await _context.Departments
                .AsNoTracking()
                .Include(d => d.Employees)
                .Select(d => new
                {
                    id = d.Id,
                    name = d.Name,
                    manager = d.Manager,
                    budget = d.Budget,
                    employees = d.Employees.Select(e => new
                    {
                        id = e.Id,
                        name = e.Name,
                        email = e.Email,
                        phone = e.Phone,
                        position = e.Position,
                        salary = e.Salary,
                        joiningDate = e.JoiningDate,
                        status = e.Status,
                        departmentId = e.DepartmentId
                    }).ToList()
                })
                .ToListAsync();

            return Ok(departments);
        }

        // GET: api/Departments/1
        [HttpGet("{id:int}")]
        public async Task<ActionResult<object>> GetDepartment(int id)
        {
            var department = await _context.Departments
                .AsNoTracking()
                .Include(d => d.Employees)
                .Where(d => d.Id == id)
                .Select(d => new
                {
                    id = d.Id,
                    name = d.Name,
                    manager = d.Manager,
                    budget = d.Budget,
                    employees = d.Employees.Select(e => new
                    {
                        id = e.Id,
                        name = e.Name,
                        email = e.Email,
                        phone = e.Phone,
                        position = e.Position,
                        salary = e.Salary,
                        joiningDate = e.JoiningDate,
                        status = e.Status,
                        departmentId = e.DepartmentId
                    }).ToList()
                })
                .FirstOrDefaultAsync();

            if (department == null)
            {
                return NotFound(new
                {
                    message = "Department not found."
                });
            }

            return Ok(department);
        }

        // POST: api/Departments
        [HttpPost]
        public async Task<ActionResult> CreateDepartment(
            [FromBody] DepartmentRequest request)
        {
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            var name = request.Name.Trim();

            if (string.IsNullOrWhiteSpace(name))
            {
                return BadRequest(new
                {
                    message = "Department name is required."
                });
            }

            var duplicate = await _context.Departments
                .AnyAsync(d =>
                    d.Name.ToLower() == name.ToLower());

            if (duplicate)
            {
                return Conflict(new
                {
                    message =
                        "A department with this name already exists."
                });
            }

            if (request.Budget < 0)
            {
                return BadRequest(new
                {
                    message =
                        "Budget cannot be negative."
                });
            }

            var department = new Department
            {
                Name = name,
                Manager = request.Manager?.Trim() ?? string.Empty,
                Budget = request.Budget
            };

            _context.Departments.Add(department);

            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetDepartment),
                new { id = department.Id },
                new
                {
                    id = department.Id,
                    name = department.Name,
                    manager = department.Manager,
                    budget = department.Budget,
                    employees = Array.Empty<object>()
                });
        }

        // PUT: api/Departments/1
        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateDepartment(
            int id,
            [FromBody] DepartmentRequest request)
        {
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            var name = request.Name.Trim();

            if (string.IsNullOrWhiteSpace(name))
            {
                return BadRequest(new
                {
                    message = "Department name is required."
                });
            }

            if (request.Budget < 0)
            {
                return BadRequest(new
                {
                    message =
                        "Budget cannot be negative."
                });
            }

            var department = await _context.Departments
                .FirstOrDefaultAsync(d => d.Id == id);

            if (department == null)
            {
                return NotFound(new
                {
                    message = "Department not found."
                });
            }

            var duplicate = await _context.Departments
                .AnyAsync(d =>
                    d.Id != id &&
                    d.Name.ToLower() == name.ToLower());

            if (duplicate)
            {
                return Conflict(new
                {
                    message =
                        "Another department with this name already exists."
                });
            }

            department.Name = name;
            department.Manager =
                request.Manager?.Trim() ?? string.Empty;
            department.Budget = request.Budget;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/Departments/1
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteDepartment(
            int id)
        {
            var department = await _context.Departments
                .Include(d => d.Employees)
                .FirstOrDefaultAsync(d => d.Id == id);

            if (department == null)
            {
                return NotFound(new
                {
                    message = "Department not found."
                });
            }

            if (department.Employees.Any())
            {
                return BadRequest(new
                {
                    message =
                        "This department cannot be deleted because employees are assigned to it. Move or delete the employees first."
                });
            }

            _context.Departments.Remove(department);

            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}