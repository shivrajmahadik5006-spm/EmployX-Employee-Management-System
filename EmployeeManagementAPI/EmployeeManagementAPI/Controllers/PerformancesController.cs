
using EmployeeManagementAPI.Data;
using EmployeeManagementAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagementAPI.Controllers;

[Route("api/[controller]")]
[ApiController]
public class PerformancesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public PerformancesController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/Performances
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Performance>>> GetAll()
    {
        var performances = await _context.Performances
            .Include(p => p.Employee)
            .OrderByDescending(p => p.ReviewDate)
            .ToListAsync();

        return Ok(performances);
    }

    // GET: api/Performances/1
    [HttpGet("{id:int}")]
    public async Task<ActionResult<Performance>> GetById(int id)
    {
        var performance = await _context.Performances
            .Include(p => p.Employee)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (performance == null)
            return NotFound(new { message = "Performance review not found." });

        return Ok(performance);
    }

    // GET: api/Performances/employee/1
    [HttpGet("employee/{employeeId:int}")]
    public async Task<ActionResult<IEnumerable<Performance>>> GetByEmployee(
        int employeeId)
    {
        var employeeExists = await _context.Employees
            .AnyAsync(e => e.Id == employeeId);

        if (!employeeExists)
            return NotFound(new { message = "Employee not found." });

        var performances = await _context.Performances
            .Where(p => p.EmployeeId == employeeId)
            .OrderByDescending(p => p.ReviewDate)
            .ToListAsync();

        return Ok(performances);
    }

    // POST: api/Performances
    [HttpPost]
    public async Task<ActionResult<Performance>> Create(
        [FromBody] Performance request)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var employeeExists = await _context.Employees
            .AnyAsync(e => e.Id == request.EmployeeId);

        if (!employeeExists)
            return BadRequest(new { message = "Employee does not exist." });

        if (request.ReviewDate.Date > DateTime.Today)
            return BadRequest(new { message = "Review date cannot be in the future." });

        var performance = new Performance
        {
            EmployeeId = request.EmployeeId,
            Rating = request.Rating,
            Strengths = request.Strengths.Trim(),
            AreasForImprovement = request.AreasForImprovement.Trim(),
            Comments = request.Comments?.Trim(),
            ReviewedBy = request.ReviewedBy.Trim(),
            ReviewDate = request.ReviewDate.Date,
            ReviewPeriod = request.ReviewPeriod.Trim()
        };

        _context.Performances.Add(performance);
        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetById),
            new { id = performance.Id },
            performance);
    }

    // PUT: api/Performances/1
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(
        int id, [FromBody] Performance request)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var performance = await _context.Performances.FindAsync(id);

        if (performance == null)
            return NotFound(new { message = "Performance review not found." });

        var employeeExists = await _context.Employees
            .AnyAsync(e => e.Id == request.EmployeeId);

        if (!employeeExists)
            return BadRequest(new { message = "Employee does not exist." });

        if (request.ReviewDate.Date > DateTime.Today)
            return BadRequest(new { message = "Review date cannot be in the future." });

        performance.EmployeeId = request.EmployeeId;
        performance.Rating = request.Rating;
        performance.Strengths = request.Strengths.Trim();
        performance.AreasForImprovement = request.AreasForImprovement.Trim();
        performance.Comments = request.Comments?.Trim();
        performance.ReviewedBy = request.ReviewedBy.Trim();
        performance.ReviewDate = request.ReviewDate.Date;
        performance.ReviewPeriod = request.ReviewPeriod.Trim();

        await _context.SaveChangesAsync();

        return Ok(performance);
    }

    // DELETE: api/Performances/1
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var performance = await _context.Performances.FindAsync(id);

        if (performance == null)
            return NotFound(new { message = "Performance review not found." });

        _context.Performances.Remove(performance);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Performance review deleted successfully." });
    }
}