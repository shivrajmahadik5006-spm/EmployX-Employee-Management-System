
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using EmployeeManagementAPI.Data;
using EmployeeManagementAPI.Models;
using EmployeeManagementAPI.Models.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace EmployeeManagementAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly IConfiguration _configuration;
        private readonly ApplicationDbContext _context;

        public AuthController(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            IConfiguration configuration,
            ApplicationDbContext context)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _configuration = configuration;
            _context = context;
        }

        // POST: api/Auth/register
        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register(
            RegisterRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var existingUser = await _userManager
                .FindByEmailAsync(request.Email);

            if (existingUser != null)
                return Conflict(new { message = "Email is already registered." });

            // If EmployeeId is supplied, ensure it exists and
            // isn't already linked to another account.
            if (request.EmployeeId.HasValue)
            {
                var employee = await _context.Employees
                    .FindAsync(request.EmployeeId.Value);

                if (employee == null)
                    return BadRequest(new { message = "Employee not found." });

                var alreadyLinked = await _context.Users
                    .AnyAsync(u => u.EmployeeId == request.EmployeeId);

                if (alreadyLinked)
                    return Conflict(new { message = "This employee already has an account." });
            }

            var user = new ApplicationUser
            {
                UserName = request.Email,
                Email = request.Email,
                FullName = request.FullName,
                EmployeeId = request.EmployeeId
            };

            var result = await _userManager
                .CreateAsync(user, request.Password);

            if (!result.Succeeded)
                return BadRequest(new
                {
                    errors = result.Errors.Select(e => e.Description)
                });

            // Public registration always assigns Employee role.
            await _userManager.AddToRoleAsync(user, "Employee");

            return Ok(new
            {
                message = "Account registered successfully."
            });
        }

        // POST: api/Auth/login
        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login(LoginRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = await _userManager
                .FindByEmailAsync(request.Email);

            if (user == null)
                return Unauthorized(new { message = "Invalid email or password." });

            var passwordValid = await _signInManager
                .CheckPasswordSignInAsync(user, request.Password, true);

            if (!passwordValid.Succeeded)
                return Unauthorized(new { message = "Invalid email or password." });

            var roles = await _userManager.GetRolesAsync(user);

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Name, user.FullName),
                new Claim(ClaimTypes.Email, user.Email ?? string.Empty)
            };

            if (user.EmployeeId.HasValue)
            {
                claims.Add(
                    new Claim("EmployeeId", user.EmployeeId.Value.ToString())
                );
            }

            claims.AddRange(roles.Select(role =>
                new Claim(ClaimTypes.Role, role)));

            var keyText = _configuration["Jwt:Key"]
                ?? throw new InvalidOperationException("JWT Key is missing.");

            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(keyText));

            var credentials = new SigningCredentials(
                key, SecurityAlgorithms.HmacSha256);

            var expiryMinutes = int.TryParse(
                _configuration["Jwt:ExpiryMinutes"], out var minutes)
                ? minutes : 60;

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
                signingCredentials: credentials);

            return Ok(new
            {
                message = "Login successful.",
                token = new JwtSecurityTokenHandler().WriteToken(token),
                expiresAt = token.ValidTo,
                user = new
                {
                    user.Id,
                    user.FullName,
                    user.Email,
                    user.EmployeeId,
                    roles
                }
            });
        }

        // POST: api/Auth/logout
        [HttpPost("logout")]
        [Authorize]
        public IActionResult Logout()
        {
            // JWT is stateless. The Angular client must remove
            // its stored token when logging out.
            return Ok(new
            {
                message = "Logout successful. Clear the token on the client."
            });
        }
    }
}