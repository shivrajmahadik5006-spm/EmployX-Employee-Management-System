
using EmployeeManagementAPI.Data;
using EmployeeManagementAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagementAPI.Controllers;

[Route("api/[controller]")]
[ApiController]
public class NotificationsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public NotificationsController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/Notifications
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Notification>>> GetAll()
    {
        var notifications = await _context.Notifications
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync();

        return Ok(notifications);
    }

    // GET: api/Notifications/employee/1
    [HttpGet("employee/{employeeId:int}")]
    public async Task<ActionResult<IEnumerable<Notification>>> GetByEmployee(
        int employeeId)
    {
        var exists = await _context.Employees
            .AnyAsync(e => e.Id == employeeId);

        if (!exists)
            return NotFound(new { message = "Employee not found." });

        var notifications = await _context.Notifications
            .Where(n => n.EmployeeId == employeeId)
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync();

        return Ok(notifications);
    }

    // POST: api/Notifications
    [HttpPost]
    public async Task<ActionResult<Notification>> Create(
        [FromBody] Notification request)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        if (string.IsNullOrWhiteSpace(request.Title) ||
            string.IsNullOrWhiteSpace(request.Message))
        {
            return BadRequest(new
            {
                message = "Title and message are required."
            });
        }

        var employeeExists = await _context.Employees
            .AnyAsync(e => e.Id == request.EmployeeId);

        if (!employeeExists)
            return BadRequest(new { message = "Employee does not exist." });

        var notification = new Notification
        {
            EmployeeId = request.EmployeeId,
            Title = request.Title.Trim(),
            Message = request.Message.Trim(),
            Type = request.Type.Trim(),
            IsRead = false,
            CreatedAt = DateTime.Now
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetByEmployee),
            new { employeeId = notification.EmployeeId },
            notification);
    }

    // PUT: api/Notifications/1/read
    [HttpPut("{id:int}/read")]
    public async Task<IActionResult> MarkAsRead(int id)
    {
        var notification = await _context.Notifications.FindAsync(id);

        if (notification == null)
            return NotFound(new { message = "Notification not found." });

        notification.IsRead = true;
        notification.ReadAt = DateTime.Now;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Notification marked as read.",
            notification.Id,
            notification.IsRead,
            notification.ReadAt
        });
    }

    // DELETE: api/Notifications/1
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var notification = await _context.Notifications.FindAsync(id);

        if (notification == null)
            return NotFound(new { message = "Notification not found." });

        _context.Notifications.Remove(notification);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Notification deleted successfully." });
    }
}