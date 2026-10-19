using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EmployeeManagementAPI.Migrations
{
    /// <inheritdoc />
    public partial class SetPayrollPaymentStatusDefault : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Payrolls_Employees_EmployeeId",
                table: "Payrolls");

            migrationBuilder.AlterColumn<string>(
                name: "PaymentStatus",
                table: "Payrolls",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Pending",
                oldClrType: typeof(string),
                oldType: "nvarchar(20)",
                oldMaxLength: 20);

            migrationBuilder.AddForeignKey(
                name: "FK_Payrolls_Employees_EmployeeId",
                table: "Payrolls",
                column: "EmployeeId",
                principalTable: "Employees",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Payrolls_Employees_EmployeeId",
                table: "Payrolls");

            migrationBuilder.AlterColumn<string>(
                name: "PaymentStatus",
                table: "Payrolls",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(20)",
                oldMaxLength: 20,
                oldDefaultValue: "Pending");

            migrationBuilder.AddForeignKey(
                name: "FK_Payrolls_Employees_EmployeeId",
                table: "Payrolls",
                column: "EmployeeId",
                principalTable: "Employees",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
