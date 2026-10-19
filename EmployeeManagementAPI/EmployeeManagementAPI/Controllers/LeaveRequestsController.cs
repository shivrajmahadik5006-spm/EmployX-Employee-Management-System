
using EmployeeManagementAPI.Data;
using EmployeeManagementAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagementAPI.Controllers;

[Route("api/[controller]")]
[ApiController]
public class LeaveRequestsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public LeaveRequestsController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/LeaveRequests
    // Get all leave requests
    [HttpGet]
    public async Task<ActionResult<IEnumerable<LeaveRequest>>> GetAll()
    {
        var leaves = await _context.LeaveRequests
            .Include(l => l.Employee)
            .OrderByDescending(l => l.RequestedAt)
            .AsNoTracking()
            .ToListAsync();

        return Ok(leaves);
    }

    // GET: api/LeaveRequests/5
    // Get a leave request by ID
    [HttpGet("{id:int}")]
    public async Task<ActionResult<LeaveRequest>> GetById(int id)
    {
        var leave = await _context.LeaveRequests
            .Include(l => l.Employee)
            .AsNoTracking()
            .FirstOrDefaultAsync(l => l.Id == id);

        if (leave == null)
        {
            return NotFound(new
            {
                message = "Leave request not found."
            });
        }

        return Ok(leave);
    }

    // GET: api/LeaveRequests/employee/1
    // Get leave requests for a specific employee
    [HttpGet("employee/{employeeId:int}")]
    public async Task<ActionResult<IEnumerable<LeaveRequest>>> GetByEmployee(
        int employeeId)
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

        var leaves = await _context.LeaveRequests
            .Where(l => l.EmployeeId == employeeId)
            .OrderByDescending(l => l.RequestedAt)
            .AsNoTracking()
            .ToListAsync();

        return Ok(leaves);
    }

    // POST: api/LeaveRequests
    // Submit a new leave request
    [HttpPost]
    public async Task<ActionResult> Create(
        [FromBody] CreateLeaveRequest request)
    {
        // Validate employee
        var employeeExists = await _context.Employees
            .AnyAsync(e => e.Id == request.EmployeeId);

        if (!employeeExists)
        {
            return BadRequest(new
            {
                message = "Employee does not exist."
            });
        }

        // Validate leave type
        if (request.LeaveType != "Full Day" &&
            request.LeaveType != "Half Day")
        {
            return BadRequest(new
            {
                message = "LeaveType must be Full Day or Half Day."
            });
        }

        // Validate reason
        if (string.IsNullOrWhiteSpace(request.Reason))
        {
            return BadRequest(new
            {
                message = "Please provide a reason for leave."
            });
        }

        // Compare calendar dates, not the time of day
        var leaveDate = request.LeaveDate.Date;
        var today = DateTime.Today;

        if (leaveDate < today)
        {
            return BadRequest(new
            {
                message = "Leave date cannot be in the past.",
                today = today.ToString("yyyy-MM-dd"),
                submittedLeaveDate = leaveDate.ToString("yyyy-MM-dd")
            });
        }

        // Prevent duplicate non-rejected leave requests
        var alreadyRequested = await _context.LeaveRequests
            .AnyAsync(l =>
                l.EmployeeId == request.EmployeeId &&
                l.LeaveDate == leaveDate &&
                l.Status != "Rejected");

        if (alreadyRequested)
        {
            return Conflict(new
            {
                message = "A leave request already exists for this date."
            });
        }

        // Create leave request
        var leave = new LeaveRequest
        {
            EmployeeId = request.EmployeeId,
            LeaveDate = leaveDate,
            LeaveType = request.LeaveType,
            Reason = request.Reason.Trim(),
            Status = "Pending",
            RequestedAt = DateTime.Now
        };

        _context.LeaveRequests.Add(leave);
        await _context.SaveChangesAsync();

        // Return a response without circular navigation properties
        return CreatedAtAction(
            nameof(GetById),
            new { id = leave.Id },
            new
            {
                leave.Id,
                leave.EmployeeId,
                leave.LeaveDate,
                leave.LeaveType,
                leave.Reason,
                leave.Status,
                leave.RequestedAt
            });
    }

    // PUT: api/LeaveRequests/5/review
    // Approve or reject a pending leave request
    [HttpPut("{id:int}/review")]
    public async Task<IActionResult> Review(
        int id,
        [FromBody] ReviewLeaveRequest request)
    {
        var leave = await _context.LeaveRequests
            .FirstOrDefaultAsync(l => l.Id == id);

        if (leave == null)
        {
            return NotFound(new
            {
                message = "Leave request not found."
            });
        }

        if (leave.Status != "Pending")
        {
            return Conflict(new
            {
                message = "This leave request has already been reviewed."
            });
        }

        if (request.Status != "Approved" &&
            request.Status != "Rejected")
        {
            return BadRequest(new
            {
                message = "Status must be Approved or Rejected."
            });
        }

        leave.Status = request.Status;
        leave.ReviewedAt = DateTime.Now;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = $"Leave request {leave.Status.ToLower()}.",
            leave.Id,
            leave.Status,
            leave.ReviewedAt
        });
    }
}

// Request model for submitting leave
public class CreateLeaveRequest
{
    public int EmployeeId { get; set; }

    public DateTime LeaveDate { get; set; }

    public string LeaveType { get; set; } = "Full Day";

    public string Reason { get; set; } = string.Empty;
}

// Request model for approving or rejecting leave
public class ReviewLeaveRequest
{
    public string Status { get; set; } = string.Empty;
}