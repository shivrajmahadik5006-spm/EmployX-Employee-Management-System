using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EmployeeManagementAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddPerformance : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Performances_Employees_EmployeeId",
                table: "Performances");

            migrationBuilder.AlterColumn<string>(
                name: "ReviewPeriod",
                table: "Performances",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(30)",
                oldMaxLength: 30);

            migrationBuilder.AddForeignKey(
                name: "FK_Performances_Employees_EmployeeId",
                table: "Performances",
                column: "EmployeeId",
                principalTable: "Employees",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Performances_Employees_EmployeeId",
                table: "Performances");

            migrationBuilder.AlterColumn<string>(
                name: "ReviewPeriod",
                table: "Performances",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100);

            migrationBuilder.AddForeignKey(
                name: "FK_Performances_Employees_EmployeeId",
                table: "Performances",
                column: "EmployeeId",
                principalTable: "Employees",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
