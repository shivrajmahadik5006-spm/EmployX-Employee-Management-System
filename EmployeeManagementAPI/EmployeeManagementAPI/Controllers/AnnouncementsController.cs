using EmployeeManagementAPI.Data;
using EmployeeManagementAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagementAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AnnouncementsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AnnouncementsController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/Announcements
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Announcement>>> GetAnnouncements()
    {
        var announcements = await _context.Announcements
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();

        return Ok(announcements);
    }

    // GET: api/Announcements/5
    [HttpGet("{id:int}")]
    public async Task<ActionResult<Announcement>> GetAnnouncement(int id)
    {
        var announcement = await _context.Announcements
            .FirstOrDefaultAsync(a => a.Id == id);

        if (announcement == null)
        {
            return NotFound(new
            {
                message = "Announcement not found."
            });
        }

        return Ok(announcement);
    }

    // POST: api/Announcements
    [HttpPost]
    public async Task<ActionResult<Announcement>> CreateAnnouncement(
        Announcement announcement)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        announcement.Id = 0;
        announcement.CreatedAt = DateTime.Now;

        if (string.IsNullOrWhiteSpace(announcement.Category))
        {
            announcement.Category = "General";
        }

        announcement.IsActive = true;

        _context.Announcements.Add(announcement);

        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetAnnouncement),
            new { id = announcement.Id },
            announcement);
    }

    // PUT: api/Announcements/5
    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateAnnouncement(
        int id,
        Announcement announcement)
    {
        if (id != announcement.Id)
        {
            return BadRequest(new
            {
                message = "Announcement ID does not match."
            });
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var existingAnnouncement =
            await _context.Announcements
                .FirstOrDefaultAsync(a => a.Id == id);

        if (existingAnnouncement == null)
        {
            return NotFound(new
            {
                message = "Announcement not found."
            });
        }

        existingAnnouncement.Title =
            announcement.Title;

        existingAnnouncement.Message =
            announcement.Message;

        existingAnnouncement.Category =
            announcement.Category;

        existingAnnouncement.ExpiryDate =
            announcement.ExpiryDate;

        existingAnnouncement.IsActive =
            announcement.IsActive;

        existingAnnouncement.CreatedBy =
            announcement.CreatedBy;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // DELETE: api/Announcements/5
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteAnnouncement(int id)
    {
        var announcement =
            await _context.Announcements
                .FirstOrDefaultAsync(a => a.Id == id);

        if (announcement == null)
        {
            return NotFound(new
            {
                message = "Announcement not found."
            });
        }

        _context.Announcements.Remove(announcement);

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // PUT: api/Announcements/5/toggle
    [HttpPut("{id:int}/toggle")]
    public async Task<IActionResult> ToggleAnnouncement(int id)
    {
        var announcement =
            await _context.Announcements
                .FirstOrDefaultAsync(a => a.Id == id);

        if (announcement == null)
        {
            return NotFound(new
            {
                message = "Announcement not found."
            });
        }

        announcement.IsActive =
            !announcement.IsActive;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = announcement.IsActive
                ? "Announcement activated successfully."
                : "Announcement deactivated successfully.",

            announcement.Id,
            announcement.IsActive
        });
    }
}