using EmployeeManagementAPI.Data;
using EmployeeManagementAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace EmployeeManagementAPI.Controllers;

[Route("api/[controller]")]
[ApiController]
public class TasksController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public TasksController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/Tasks
    [HttpGet]
    public async Task<ActionResult<IEnumerable<TaskItem>>> GetAll()
    {
        var tasks = await _context.Tasks
            .Include(t => t.AssignedToEmployee)
                .ThenInclude(e => e.Department)
            .Include(t => t.AssignedByEmployee)
                .ThenInclude(e => e.Department)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

        return Ok(tasks);
    }

    // GET: api/Tasks/1
    [HttpGet("{id:int}")]
    public async Task<ActionResult<TaskItem>> GetById(int id)
    {
        var task = await _context.Tasks
            .Include(t => t.AssignedToEmployee)
                .ThenInclude(e => e.Department)
            .Include(t => t.AssignedByEmployee)
                .ThenInclude(e => e.Department)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (task == null)
            return NotFound(new { message = "Task not found." });

        return Ok(task);
    }

    // GET: api/Tasks/employee/1
    [HttpGet("employee/{employeeId:int}")]
    public async Task<ActionResult<IEnumerable<TaskItem>>> GetByEmployee(
        int employeeId)
    {
        var employeeExists = await _context.Employees
            .AnyAsync(e => e.Id == employeeId);

        if (!employeeExists)
            return NotFound(new { message = "Employee not found." });

        var tasks = await _context.Tasks
            .Where(t => t.AssignedToEmployeeId == employeeId)
            .Include(t => t.AssignedToEmployee)
                .ThenInclude(e => e.Department)
            .Include(t => t.AssignedByEmployee)
                .ThenInclude(e => e.Department)
            .OrderBy(t => t.DueDate)
            .ToListAsync();

        return Ok(tasks);
    }

    // POST: api/Tasks
    [HttpPost]
    public async Task<ActionResult<TaskItem>> Create(
        [FromBody] TaskItem request)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        if (string.IsNullOrWhiteSpace(request.Title) ||
            string.IsNullOrWhiteSpace(request.Description))
        {
            return BadRequest(new
            {
                message = "Title and description are required."
            });
        }

        if (request.Priority is not ("Low" or "Medium" or "High"))
        {
            return BadRequest(new
            {
                message = "Priority must be Low, Medium, or High."
            });
        }

        var validStatuses = new[]
        {
            "Pending",
            "In Progress",
            "Completed"
        };

        if (!validStatuses.Contains(request.Status))
        {
            return BadRequest(new
            {
                message =
                    "Status must be Pending, In Progress, or Completed."
            });
        }

        // Check assigned employee
        var assignedEmployeeExists = await _context.Employees
            .AnyAsync(e => e.Id == request.AssignedToEmployeeId);

        if (!assignedEmployeeExists)
        {
            return BadRequest(new
            {
                message = "Assigned employee does not exist."
            });
        }

        // AssignedByEmployeeId is optional.
        // Manager/Admin accounts may not have an Employee profile.
        if (request.AssignedByEmployeeId.HasValue)
        {
            var assigningEmployeeExists = await _context.Employees
                .AnyAsync(
                    e => e.Id == request.AssignedByEmployeeId.Value);

            if (!assigningEmployeeExists)
            {
                return BadRequest(new
                {
                    message = "Assigning employee does not exist."
                });
            }
        }

        var task = new TaskItem
        {
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),

            AssignedToEmployeeId =
                request.AssignedToEmployeeId,

            AssignedByEmployeeId =
                request.AssignedByEmployeeId,

            Priority = request.Priority,
            Status = request.Status,
            DueDate = request.DueDate.Date,
            CreatedAt = DateTime.Now,

            CompletedAt =
                request.Status == "Completed"
                    ? DateTime.Now
                    : null
        };

        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetById),
            new { id = task.Id },
            task);
    }

    // PUT: api/Tasks/1/status
    [HttpPut("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(
        int id,
        [FromBody] UpdateTaskStatusRequest request)
    {
        var task = await _context.Tasks.FindAsync(id);

        if (task == null)
            return NotFound(new
            {
                message = "Task not found."
            });

        var validStatuses = new[]
        {
            "Pending",
            "In Progress",
            "Completed"
        };

        if (!validStatuses.Contains(request.Status))
        {
            return BadRequest(new
            {
                message =
                    "Status must be Pending, In Progress, or Completed."
            });
        }

        task.Status = request.Status;

        task.CompletedAt =
            request.Status == "Completed"
                ? DateTime.Now
                : null;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Task status updated successfully.",
            task.Id,
            task.Status,
            task.CompletedAt
        });
    }

    // PUT: api/Tasks/1
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(
        int id,
        [FromBody] TaskItem request)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var task = await _context.Tasks.FindAsync(id);

        if (task == null)
            return NotFound(new
            {
                message = "Task not found."
            });

        var assignedEmployeeExists = await _context.Employees
            .AnyAsync(e => e.Id == request.AssignedToEmployeeId);

        if (!assignedEmployeeExists)
        {
            return BadRequest(new
            {
                message = "Assigned employee does not exist."
            });
        }

        if (request.AssignedByEmployeeId.HasValue)
        {
            var assigningEmployeeExists = await _context.Employees
                .AnyAsync(
                    e => e.Id == request.AssignedByEmployeeId.Value);

            if (!assigningEmployeeExists)
            {
                return BadRequest(new
                {
                    message = "Assigning employee does not exist."
                });
            }
        }

        if (request.Priority is not ("Low" or "Medium" or "High"))
        {
            return BadRequest(new
            {
                message = "Invalid priority."
            });
        }

        task.Title = request.Title.Trim();
        task.Description = request.Description.Trim();

        task.AssignedToEmployeeId =
            request.AssignedToEmployeeId;

        task.AssignedByEmployeeId =
            request.AssignedByEmployeeId;

        task.Priority = request.Priority;
        task.DueDate = request.DueDate.Date;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Task updated successfully.",
            task.Id
        });
    }

    // DELETE: api/Tasks/1
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var task = await _context.Tasks.FindAsync(id);

        if (task == null)
            return NotFound(new
            {
                message = "Task not found."
            });

        _context.Tasks.Remove(task);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Task deleted successfully."
        });
    }
}

public class UpdateTaskStatusRequest
{
    [Required]
    public string Status { get; set; } = string.Empty;
}