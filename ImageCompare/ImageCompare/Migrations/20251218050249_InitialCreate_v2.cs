using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ImageCompare.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate_v2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double[]>(
                name: "FaceEmbeddings",
                table: "Users",
                type: "double precision[]",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FaceEmbeddings",
                table: "Users");
        }
    }
}
