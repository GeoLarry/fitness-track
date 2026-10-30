using Microsoft.EntityFrameworkCore;
using Starter.Core.Models;

namespace Starter.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<Exercise> Exercises => Set<Exercise>();
    public DbSet<ExerciseMuscle> ExerciseMuscles => Set<ExerciseMuscle>();
    public DbSet<Muscle> Muscles => Set<Muscle>();
    public DbSet<Equipment> Equipment => Set<Equipment>();
    public DbSet<ExerciseType> ExerciseTypes => Set<ExerciseType>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(user =>
        {
            user.Property(u => u.Username).HasMaxLength(50);
            user.Property(u => u.NormalizedUsername).HasMaxLength(50);
            user.Property(u => u.Email).HasMaxLength(256);
            user.Property(u => u.NormalizedEmail).HasMaxLength(256);
            user.Property(u => u.PasswordHash).HasMaxLength(100);
            user.Property(u => u.FirstName).HasMaxLength(100);
            user.Property(u => u.LastName).HasMaxLength(100);

            user.HasIndex(u => u.NormalizedUsername).IsUnique();
            user.HasIndex(u => u.NormalizedEmail).IsUnique();
        });

        modelBuilder.Entity<Role>(role =>
        {
            role.Property(r => r.Name).HasMaxLength(100);
            role.Property(r => r.Description).HasMaxLength(500);
            role.HasIndex(r => r.Name).IsUnique();

            role.HasMany(r => r.Permissions)
                .WithOne()
                .HasForeignKey(p => p.RoleId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<UserRole>(userRole =>
        {
            userRole.HasKey(ur => new { ur.UserId, ur.RoleId });

            userRole.HasOne(ur => ur.User)
                .WithMany(u => u.UserRoles)
                .HasForeignKey(ur => ur.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Restrict: a role still in use must never disappear from under its users.
            userRole.HasOne(ur => ur.Role)
                .WithMany(r => r.UserRoles)
                .HasForeignKey(ur => ur.RoleId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<RolePermission>(permission =>
        {
            permission.HasKey(p => new { p.RoleId, p.Module, p.Action });

            // Stored as text ("Users", "Edit") so the database stays readable
            // and enum members can be reordered without a data migration.
            permission.Property(p => p.Module).HasConversion<string>().HasMaxLength(50);
            permission.Property(p => p.Action).HasConversion<string>().HasMaxLength(50);
        });

        modelBuilder.Entity<Exercise>(exercise =>
        {
            exercise.Property(e => e.Name).HasMaxLength(100);
            exercise.Property(e => e.NormalizedName).HasMaxLength(100);
            exercise.Property(e => e.Description).HasMaxLength(1000);
            exercise.Property(e => e.Instructions).HasMaxLength(4000);

            // One name per owner: the shared catalog (null owner) and each user's custom exercises.
            // The service also stops a custom exercise from repeating a shared one.
            exercise.HasIndex(e => new { e.CreatedByUserId, e.NormalizedName }).IsUnique();

            exercise.HasOne(e => e.ExerciseType).WithMany().HasForeignKey(e => e.ExerciseTypeId).OnDelete(DeleteBehavior.Restrict);
            exercise.HasOne(e => e.Equipment).WithMany().HasForeignKey(e => e.EquipmentId).OnDelete(DeleteBehavior.Restrict);

            // A user's custom exercises go with the user.
            exercise.HasOne(e => e.CreatedByUser).WithMany().HasForeignKey(e => e.CreatedByUserId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ExerciseMuscle>(exerciseMuscle =>
        {
            exerciseMuscle.HasKey(em => new { em.ExerciseId, em.MuscleId });

            exerciseMuscle.HasOne<Exercise>().WithMany(e => e.Muscles).HasForeignKey(em => em.ExerciseId).OnDelete(DeleteBehavior.Cascade);
            exerciseMuscle.HasOne(em => em.Muscle).WithMany().HasForeignKey(em => em.MuscleId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Muscle>(muscle =>
        {
            muscle.Property(m => m.Name).HasMaxLength(100);
            muscle.HasIndex(m => m.Name).IsUnique();
        });

        modelBuilder.Entity<Equipment>(equipment =>
        {
            equipment.Property(e => e.Name).HasMaxLength(100);
            equipment.HasIndex(e => e.Name).IsUnique();
        });

        modelBuilder.Entity<ExerciseType>(type =>
        {
            type.Property(t => t.Name).HasMaxLength(100);
            type.HasIndex(t => t.Name).IsUnique();
        });
    }
}
