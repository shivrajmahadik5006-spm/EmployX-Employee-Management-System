using EmployeeManagementAPI.Data;
using EmployeeManagementAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagementAPI.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AttendanceController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AttendanceController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/attendance
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Attendance>>> GetAttendance()
    {
        return await _context.Attendances
            .Include(a => a.Employee)
            .OrderByDescending(a => a.Date)
            .ToListAsync();
    }

    // GET: api/attendance/5
    [HttpGet("{id:int}")]
    public async Task<ActionResult<Attendance>> GetAttendanceById(int id)
    {
        var record = await _context.Attendances
            .Include(a => a.Employee)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (record == null)
        {
            return NotFound(new
            {
                message = "Attendance record not found."
            });
        }

        return record;
    }

    // GET: api/attendance/employee/8
    [HttpGet("employee/{employeeId:int}")]
    public async Task<ActionResult<IEnumerable<Attendance>>>
        GetEmployeeAttendance(int employeeId)
    {
        var employeeExists = await _context.Employees
            .AnyAsync(e => e.Id == employeeId);

        if (!employeeExists)
        {
            return NotFound(new
            {
                message = "Employee not found."
            });
        }

        var records = await _context.Attendances
            .Include(a => a.Employee)
            .Where(a => a.EmployeeId == employeeId)
            .OrderByDescending(a => a.Date)
            .ToListAsync();

        return Ok(records);
    }

    // GET: api/attendance/today/8
    [HttpGet("today/{employeeId:int}")]
    public async Task<ActionResult<Attendance>>
        GetTodayAttendance(int employeeId)
    {
        var employeeExists = await _context.Employees
            .AnyAsync(e => e.Id == employeeId);

        if (!employeeExists)
        {
            return NotFound(new
            {
                message = "Employee not found."
            });
        }

        var today = DateTime.Today;

        var record = await _context.Attendances
            .Include(a => a.Employee)
            .FirstOrDefaultAsync(a =>
                a.EmployeeId == employeeId &&
                a.Date == today);

        if (record == null)
        {
            return NotFound(new
            {
                message =
                    "No attendance record found for today."
            });
        }

        return Ok(record);
    }

    // POST: api/attendance/check-in
    [HttpPost("check-in")]
    public async Task<ActionResult<Attendance>> CheckIn(
        [FromBody] AttendanceRequest request)
    {
        var employeeExists = await _context.Employees
            .AnyAsync(e => e.Id == request.EmployeeId);

        if (!employeeExists)
        {
            return BadRequest(new
            {
                message = "Employee does not exist."
            });
        }

        var now = DateTime.Now;
        var today = now.Date;

        var existing = await _context.Attendances
            .FirstOrDefaultAsync(a =>
                a.EmployeeId == request.EmployeeId &&
                a.Date == today);

        if (existing != null)
        {
            return Conflict(new
            {
                message = existing.CheckOut == null
                    ? "Employee has already checked in today."
                    : "Attendance for today is already completed."
            });
        }

        var attendance = new Attendance
        {
            EmployeeId = request.EmployeeId,
            Date = today,
            CheckIn = now
        };

        _context.Attendances.Add(attendance);

        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetAttendanceById),
            new
            {
                id = attendance.Id
            },
            attendance);
    }

    // POST: api/attendance/check-out
    [HttpPost("check-out")]
    public async Task<IActionResult> CheckOut(
        [FromBody] AttendanceRequest request)
    {
        var today = DateTime.Now.Date;

        var attendance = await _context.Attendances
            .FirstOrDefaultAsync(a =>
                a.EmployeeId == request.EmployeeId &&
                a.Date == today);

        if (attendance == null)
        {
            return BadRequest(new
            {
                message =
                    "Please check in before checking out."
            });
        }

        if (attendance.CheckOut != null)
        {
            return Conflict(new
            {
                message =
                    "Employee has already checked out today."
            });
        }

        attendance.CheckOut = DateTime.Now;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Check-out successful.",
            attendance.Id,
            attendance.EmployeeId,
            attendance.Date,
            attendance.CheckIn,
            attendance.CheckOut,
            WorkingHours = Math.Round(
                (attendance.CheckOut.Value -
                 attendance.CheckIn).TotalHours,
                2)
        });
    }
}

// Request body for check-in and check-out
public class AttendanceRequest
{
    public int EmployeeId { get; set; }
}