using EmployeeManagementAPI.Models;
using Microsoft.AspNetCore.Identity;

namespace EmployeeManagementAPI.Data
{
    public static class IdentitySeeder
    {
        public static async Task SeedAsync(IServiceProvider services)
        {
            var roleManager =
                services.GetRequiredService<RoleManager<IdentityRole>>();

            var userManager =
                services.GetRequiredService<UserManager<ApplicationUser>>();

            // Create roles
            string[] roles =
            {
                "Admin",
                "Manager",
                "Employee"
            };

            foreach (var role in roles)
            {
                if (!await roleManager.RoleExistsAsync(role))
                {
                    var result =
                        await roleManager.CreateAsync(
                            new IdentityRole(role));

                    if (!result.Succeeded)
                    {
                        throw new InvalidOperationException(
                            $"Could not create role {role}: " +
                            string.Join(
                                ", ",
                                result.Errors.Select(e => e.Description)
                            )
                        );
                    }
                }
            }

            // ============================
            // CREATE MANAGER ACCOUNT
            // ============================

            const string managerEmail =
                "manager@employx.com";

            const string managerPassword =
                "Manager@123";

            var manager =
                await userManager.FindByEmailAsync(managerEmail);

            if (manager == null)
            {
                manager = new ApplicationUser
                {
                    UserName = managerEmail,
                    Email = managerEmail,
                    FullName = "EmployX Manager"
                };

                var result =
                    await userManager.CreateAsync(
                        manager,
                        managerPassword);

                if (!result.Succeeded)
                {
                    throw new InvalidOperationException(
                        "Could not create Manager account: " +
                        string.Join(
                            ", ",
                            result.Errors.Select(e => e.Description)
                        )
                    );
                }
            }

            // Make sure Manager role is assigned
            if (!await userManager.IsInRoleAsync(manager, "Manager"))
            {
                var result =
                    await userManager.AddToRoleAsync(
                        manager,
                        "Manager");

                if (!result.Succeeded)
                {
                    throw new InvalidOperationException(
                        "Could not assign Manager role: " +
                        string.Join(
                            ", ",
                            result.Errors.Select(e => e.Description)
                        )
                    );
                }
            }

            // ============================
            // CREATE ADMIN ACCOUNT
            // ============================

            const string adminEmail =
                "admin@employx.com";

            const string adminPassword =
                "Admin@123";

            var admin =
                await userManager.FindByEmailAsync(adminEmail);

            if (admin == null)
            {
                admin = new ApplicationUser
                {
                    UserName = adminEmail,
                    Email = adminEmail,
                    FullName = "EmployX Admin"
                };

                var result =
                    await userManager.CreateAsync(
                        admin,
                        adminPassword);

                if (!result.Succeeded)
                {
                    throw new InvalidOperationException(
                        "Could not create Admin account: " +
                        string.Join(
                            ", ",
                            result.Errors.Select(e => e.Description)
                        )
                    );
                }
            }

            // Make sure Admin role is assigned
            if (!await userManager.IsInRoleAsync(admin, "Admin"))
            {
                var result =
                    await userManager.AddToRoleAsync(
                        admin,
                        "Admin");

                if (!result.Succeeded)
                {
                    throw new InvalidOperationException(
                        "Could not assign Admin role: " +
                        string.Join(
                            ", ",
                            result.Errors.Select(e => e.Description)
                        )
                    );
                }
            }
        }
    }
}