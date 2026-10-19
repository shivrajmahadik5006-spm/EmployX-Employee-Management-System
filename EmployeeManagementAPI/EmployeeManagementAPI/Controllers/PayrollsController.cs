using System.ComponentModel.DataAnnotations;
using EmployeeManagementAPI.Data;
using EmployeeManagementAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagementAPI.Controllers;

[Route("api/[controller]")]
[ApiController]
public class PayrollsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public PayrollsController(ApplicationDbContext context)
    {
        _context = context;
    }


    // ============================================================
    // GET ALL PAYROLL
    // GET: api/Payrolls
    // ============================================================

    [HttpGet]
    public async Task<ActionResult<IEnumerable<PayrollResponse>>> GetAll()
    {
        var payrolls = await _context.Payrolls
            .AsNoTracking()
            .OrderByDescending(p => p.Year)
            .ThenByDescending(p => p.Month)
            .ThenBy(p => p.EmployeeId)
            .Select(p => new PayrollResponse
            {
                Id = p.Id,

                EmployeeId = p.EmployeeId,

                EmployeeName = p.Employee != null
                    ? p.Employee.Name
                    : "Unknown",

                Month = p.Month,

                Year = p.Year,

                BasicSalary = p.BasicSalary,

                Allowances = p.Allowances,

                Deductions = p.Deductions,

                NetSalary = p.NetSalary,

                PaymentStatus = string.IsNullOrWhiteSpace(
                    p.PaymentStatus)
                    ? "Pending"
                    : p.PaymentStatus,

                GeneratedAt = p.GeneratedAt
            })
            .ToListAsync();

        return Ok(payrolls);
    }


    // ============================================================
    // GET PAYROLL BY ID
    // GET: api/Payrolls/1
    // ============================================================

    [HttpGet("{id:int}")]
    public async Task<ActionResult<PayrollResponse>> GetById(
        int id)
    {
        var payroll = await _context.Payrolls
            .AsNoTracking()
            .Where(p => p.Id == id)
            .Select(p => new PayrollResponse
            {
                Id = p.Id,

                EmployeeId = p.EmployeeId,

                EmployeeName = p.Employee != null
                    ? p.Employee.Name
                    : "Unknown",

                Month = p.Month,

                Year = p.Year,

                BasicSalary = p.BasicSalary,

                Allowances = p.Allowances,

                Deductions = p.Deductions,

                NetSalary = p.NetSalary,

                PaymentStatus = string.IsNullOrWhiteSpace(
                    p.PaymentStatus)
                    ? "Pending"
                    : p.PaymentStatus,

                GeneratedAt = p.GeneratedAt
            })
            .FirstOrDefaultAsync();

        if (payroll == null)
        {
            return NotFound(new
            {
                message = "Payroll record not found."
            });
        }

        return Ok(payroll);
    }


    // ============================================================
    // GET PAYROLL BY EMPLOYEE
    // GET: api/Payrolls/employee/{employeeId}
    // ============================================================

    [HttpGet("employee/{employeeId:int}")]
    public async Task<ActionResult<IEnumerable<PayrollResponse>>>
        GetByEmployee(int employeeId)
    {
        var employeeExists =
            await _context.Employees
                .AnyAsync(e => e.Id == employeeId);

        if (!employeeExists)
        {
            return NotFound(new
            {
                message =
                    $"Employee ID {employeeId} was not found."
            });
        }

        var payrolls = await _context.Payrolls
            .AsNoTracking()
            .Where(p =>
                p.EmployeeId == employeeId)
            .OrderByDescending(p => p.Year)
            .ThenByDescending(p => p.Month)
            .Select(p => new PayrollResponse
            {
                Id = p.Id,

                EmployeeId = p.EmployeeId,

                EmployeeName = p.Employee != null
                    ? p.Employee.Name
                    : "Unknown",

                Month = p.Month,

                Year = p.Year,

                BasicSalary = p.BasicSalary,

                Allowances = p.Allowances,

                Deductions = p.Deductions,

                NetSalary = p.NetSalary,

                PaymentStatus = string.IsNullOrWhiteSpace(
                    p.PaymentStatus)
                    ? "Pending"
                    : p.PaymentStatus,

                GeneratedAt = p.GeneratedAt
            })
            .ToListAsync();

        return Ok(payrolls);
    }


    // ============================================================
    // CREATE PAYROLL FOR ONE EMPLOYEE
    // POST: api/Payrolls
    // ============================================================

    [HttpPost]
    public async Task<ActionResult<PayrollResponse>> Create(
        [FromBody] CreatePayrollRequest request)
    {
        // --------------------------------------------------------
        // Check employee
        // --------------------------------------------------------

        var employee =
            await _context.Employees
                .FirstOrDefaultAsync(
                    e => e.Id == request.EmployeeId);

        if (employee == null)
        {
            return BadRequest(new
            {
                message =
                    $"Employee ID {request.EmployeeId} was not found."
            });
        }


        // --------------------------------------------------------
        // Check duplicate payroll
        // --------------------------------------------------------

        var alreadyExists =
            await _context.Payrolls
                .AnyAsync(p =>
                    p.EmployeeId ==
                        request.EmployeeId
                    &&
                    p.Month ==
                        request.Month
                    &&
                    p.Year ==
                        request.Year);

        if (alreadyExists)
        {
            return Conflict(new
            {
                message =
                    "Payroll already exists for this employee and month."
            });
        }


        // --------------------------------------------------------
        // Validate allowances
        // --------------------------------------------------------

        if (request.Allowances < 0)
        {
            return BadRequest(new
            {
                message =
                    "Allowances cannot be negative."
            });
        }


        // --------------------------------------------------------
        // Validate deductions
        // --------------------------------------------------------

        if (request.Deductions < 0)
        {
            return BadRequest(new
            {
                message =
                    "Deductions cannot be negative."
            });
        }


        // --------------------------------------------------------
        // Calculate salary
        // --------------------------------------------------------

        decimal basicSalary =
            employee.Salary;

        decimal grossSalary =
            basicSalary +
            request.Allowances;

        if (request.Deductions > grossSalary)
        {
            return BadRequest(new
            {
                message =
                    "Deductions cannot exceed gross salary."
            });
        }

        decimal netSalary =
            grossSalary -
            request.Deductions;


        // --------------------------------------------------------
        // Create payroll
        // --------------------------------------------------------

        var payroll = new Payroll
        {
            EmployeeId =
                employee.Id,

            Month =
                request.Month,

            Year =
                request.Year,

            BasicSalary =
                basicSalary,

            Allowances =
                request.Allowances,

            Deductions =
                request.Deductions,

            NetSalary =
                netSalary,

            PaymentStatus =
                "Pending",

            GeneratedAt =
                DateTime.Now
        };


        _context.Payrolls.Add(payroll);

        await _context.SaveChangesAsync();


        // --------------------------------------------------------
        // Response
        // --------------------------------------------------------

        var response = new PayrollResponse
        {
            Id =
                payroll.Id,

            EmployeeId =
                employee.Id,

            EmployeeName =
                employee.Name,

            Month =
                payroll.Month,

            Year =
                payroll.Year,

            BasicSalary =
                payroll.BasicSalary,

            Allowances =
                payroll.Allowances,

            Deductions =
                payroll.Deductions,

            NetSalary =
                payroll.NetSalary,

            PaymentStatus =
                payroll.PaymentStatus,

            GeneratedAt =
                payroll.GeneratedAt
        };


        return CreatedAtAction(
            nameof(GetById),

            new
            {
                id = payroll.Id
            },

            response);
    }


    // ============================================================
    // GENERATE PAYROLL FOR ALL ACTIVE EMPLOYEES
    //
    // POST: api/Payrolls/generate
    //
    // This creates payroll for every active employee
    // for the selected month and year.
    // ============================================================

    [HttpPost("generate")]
    public async Task<IActionResult> GeneratePayroll(
        [FromBody] GeneratePayrollRequest request)
    {
        // --------------------------------------------------------
        // Validate month
        // --------------------------------------------------------

        if (request.Month < 1 ||
            request.Month > 12)
        {
            return BadRequest(new
            {
                message =
                    "Month must be between 1 and 12."
            });
        }


        // --------------------------------------------------------
        // Validate year
        // --------------------------------------------------------

        if (request.Year < 2000 ||
            request.Year > 2100)
        {
            return BadRequest(new
            {
                message =
                    "Year must be between 2000 and 2100."
            });
        }


        // --------------------------------------------------------
        // Validate allowances
        // --------------------------------------------------------

        if (request.Allowances < 0)
        {
            return BadRequest(new
            {
                message =
                    "Allowances cannot be negative."
            });
        }


        // --------------------------------------------------------
        // Validate deductions
        // --------------------------------------------------------

        if (request.Deductions < 0)
        {
            return BadRequest(new
            {
                message =
                    "Deductions cannot be negative."
            });
        }


        // --------------------------------------------------------
        // Get active employees
        // --------------------------------------------------------

        var employees =
            await _context.Employees
                .Where(e =>
                    e.Status == "Active")
                .OrderBy(e => e.Id)
                .ToListAsync();


        if (employees.Count == 0)
        {
            return NotFound(new
            {
                message =
                    "No active employees found."
            });
        }


        // --------------------------------------------------------
        // Counters
        // --------------------------------------------------------

        int createdCount = 0;

        int existingCount = 0;


        // --------------------------------------------------------
        // Create payroll for each employee
        // --------------------------------------------------------

        foreach (var employee in employees)
        {
            // Check if payroll already exists
            var exists =
                await _context.Payrolls
                    .AnyAsync(p =>
                        p.EmployeeId ==
                            employee.Id
                        &&
                        p.Month ==
                            request.Month
                        &&
                        p.Year ==
                            request.Year);


            // Already exists
            if (exists)
            {
                existingCount++;

                continue;
            }


            // ----------------------------------------------------
            // Salary calculation
            // ----------------------------------------------------

            decimal basicSalary =
                employee.Salary;

            decimal grossSalary =
                basicSalary +
                request.Allowances;


            // Skip employee if deductions are invalid
            if (request.Deductions > grossSalary)
            {
                continue;
            }


            decimal netSalary =
                grossSalary -
                request.Deductions;


            // ----------------------------------------------------
            // Create payroll
            // ----------------------------------------------------

            var payroll = new Payroll
            {
                EmployeeId =
                    employee.Id,

                Month =
                    request.Month,

                Year =
                    request.Year,

                BasicSalary =
                    basicSalary,

                Allowances =
                    request.Allowances,

                Deductions =
                    request.Deductions,

                NetSalary =
                    netSalary,

                PaymentStatus =
                    "Pending",

                GeneratedAt =
                    DateTime.Now
            };


            _context.Payrolls.Add(payroll);

            createdCount++;
        }


        // --------------------------------------------------------
        // Save all payroll records
        // --------------------------------------------------------

        await _context.SaveChangesAsync();


        // --------------------------------------------------------
        // Return result
        // --------------------------------------------------------

        return Ok(new
        {
            message =
                "Payroll generated successfully.",

            month =
                request.Month,

            year =
                request.Year,

            totalEmployees =
                employees.Count,

            createdPayrolls =
                createdCount,

            alreadyExisting =
                existingCount
        });
    }


    // ============================================================
    // UPDATE PAYROLL
    // PUT: api/Payrolls/{id}
    // ============================================================

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(
        int id,
        [FromBody] UpdatePayrollRequest request)
    {
        var payroll =
            await _context.Payrolls
                .FirstOrDefaultAsync(
                    p => p.Id == id);


        if (payroll == null)
        {
            return NotFound(new
            {
                message =
                    "Payroll record not found."
            });
        }


        // --------------------------------------------------------
        // Check employee
        // --------------------------------------------------------

        var employee =
            await _context.Employees
                .FirstOrDefaultAsync(
                    e => e.Id ==
                        request.EmployeeId);


        if (employee == null)
        {
            return BadRequest(new
            {
                message =
                    $"Employee ID {request.EmployeeId} was not found."
            });
        }


        // --------------------------------------------------------
        // Check duplicate payroll
        // --------------------------------------------------------

        var duplicate =
            await _context.Payrolls
                .AnyAsync(p =>
                    p.Id != id
                    &&
                    p.EmployeeId ==
                        request.EmployeeId
                    &&
                    p.Month ==
                        request.Month
                    &&
                    p.Year ==
                        request.Year);


        if (duplicate)
        {
            return Conflict(new
            {
                message =
                    "Another payroll already exists for this employee and month."
            });
        }


        // --------------------------------------------------------
        // Validate allowances
        // --------------------------------------------------------

        if (request.Allowances < 0)
        {
            return BadRequest(new
            {
                message =
                    "Allowances cannot be negative."
            });
        }


        // --------------------------------------------------------
        // Validate deductions
        // --------------------------------------------------------

        if (request.Deductions < 0)
        {
            return BadRequest(new
            {
                message =
                    "Deductions cannot be negative."
            });
        }


        // --------------------------------------------------------
        // Calculate salary
        // --------------------------------------------------------

        decimal basicSalary =
            employee.Salary;

        decimal grossSalary =
            basicSalary +
            request.Allowances;


        if (request.Deductions > grossSalary)
        {
            return BadRequest(new
            {
                message =
                    "Deductions cannot exceed gross salary."
            });
        }


        decimal netSalary =
            grossSalary -
            request.Deductions;


        // --------------------------------------------------------
        // Update payroll
        // --------------------------------------------------------

        payroll.EmployeeId =
            employee.Id;

        payroll.Month =
            request.Month;

        payroll.Year =
            request.Year;

        payroll.BasicSalary =
            basicSalary;

        payroll.Allowances =
            request.Allowances;

        payroll.Deductions =
            request.Deductions;

        payroll.NetSalary =
            netSalary;


        // IMPORTANT:
        // PaymentStatus is NOT changed here.
        //
        // If payroll was Paid, it remains Paid.
        // --------------------------------------------------------

        await _context.SaveChangesAsync();

        return NoContent();
    }


    // ============================================================
    // MARK PAYROLL AS PAID
    // PUT: api/Payrolls/{id}/pay
    // ============================================================

    [HttpPut("{id:int}/pay")]
    public async Task<IActionResult> MarkAsPaid(
        int id)
    {
        var payroll =
            await _context.Payrolls
                .FirstOrDefaultAsync(
                    p => p.Id == id);


        if (payroll == null)
        {
            return NotFound(new
            {
                message =
                    "Payroll record not found."
            });
        }


        // --------------------------------------------------------
        // Already paid
        // --------------------------------------------------------

        if (payroll.PaymentStatus == "Paid")
        {
            return Conflict(new
            {
                message =
                    "This payroll has already been paid."
            });
        }


        // --------------------------------------------------------
        // Mark as paid
        // --------------------------------------------------------

        payroll.PaymentStatus =
            "Paid";


        await _context.SaveChangesAsync();


        return Ok(new
        {
            message =
                "Salary marked as paid successfully.",

            payroll.Id,

            payroll.EmployeeId,

            payroll.Month,

            payroll.Year,

            payroll.NetSalary,

            payroll.PaymentStatus
        });
    }


    // ============================================================
    // DELETE PAYROLL
    // DELETE: api/Payrolls/{id}
    // ============================================================

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(
        int id)
    {
        var payroll =
            await _context.Payrolls
                .FirstOrDefaultAsync(
                    p => p.Id == id);


        if (payroll == null)
        {
            return NotFound(new
            {
                message =
                    "Payroll record not found."
            });
        }


        _context.Payrolls.Remove(
            payroll);

        await _context.SaveChangesAsync();


        return NoContent();
    }
}


// ====================================================================
// CREATE PAYROLL REQUEST
// ====================================================================

public class CreatePayrollRequest
{
    [Range(
        1,
        int.MaxValue,
        ErrorMessage =
            "Select a valid employee ID."
    )]
    public int EmployeeId { get; set; }


    [Range(
        1,
        12,
        ErrorMessage =
            "Month must be between 1 and 12."
    )]
    public int Month { get; set; }


    [Range(
        2000,
        2100,
        ErrorMessage =
            "Year must be between 2000 and 2100."
    )]
    public int Year { get; set; }


    [Range(
        typeof(decimal),
        "0",
        "1000000000",
        ErrorMessage =
            "Allowances cannot be negative."
    )]
    public decimal Allowances { get; set; }


    [Range(
        typeof(decimal),
        "0",
        "1000000000",
        ErrorMessage =
            "Deductions cannot be negative."
    )]
    public decimal Deductions { get; set; }
}


// ====================================================================
// GENERATE PAYROLL REQUEST
// ====================================================================

public class GeneratePayrollRequest
{
    [Range(
        1,
        12,
        ErrorMessage =
            "Month must be between 1 and 12."
    )]
    public int Month { get; set; }


    [Range(
        2000,
        2100,
        ErrorMessage =
            "Year must be between 2000 and 2100."
    )]
    public int Year { get; set; }


    [Range(
        typeof(decimal),
        "0",
        "1000000000",
        ErrorMessage =
            "Allowances cannot be negative."
    )]
    public decimal Allowances { get; set; }


    [Range(
        typeof(decimal),
        "0",
        "1000000000",
        ErrorMessage =
            "Deductions cannot be negative."
    )]
    public decimal Deductions { get; set; }
}


// ====================================================================
// UPDATE PAYROLL REQUEST
// ====================================================================

public class UpdatePayrollRequest
{
    [Range(
        1,
        int.MaxValue,
        ErrorMessage =
            "Select a valid employee ID."
    )]
    public int EmployeeId { get; set; }


    [Range(
        1,
        12,
        ErrorMessage =
            "Month must be between 1 and 12."
    )]
    public int Month { get; set; }


    [Range(
        2000,
        2100,
        ErrorMessage =
            "Year must be between 2000 and 2100."
    )]
    public int Year { get; set; }


    [Range(
        typeof(decimal),
        "0",
        "1000000000",
        ErrorMessage =
            "Allowances cannot be negative."
    )]
    public decimal Allowances { get; set; }


    [Range(
        typeof(decimal),
        "0",
        "1000000000",
        ErrorMessage =
            "Deductions cannot be negative."
    )]
    public decimal Deductions { get; set; }
}


// ====================================================================
// PAYROLL RESPONSE
// ====================================================================

public class PayrollResponse
{
    public int Id { get; set; }

    public int EmployeeId { get; set; }

    public string EmployeeName { get; set; }
        = string.Empty;

    public int Month { get; set; }

    public int Year { get; set; }

    public decimal BasicSalary { get; set; }

    public decimal Allowances { get; set; }

    public decimal Deductions { get; set; }

    public decimal NetSalary { get; set; }

    public string PaymentStatus { get; set; }
        = "Pending";

    public DateTime GeneratedAt { get; set; }
}