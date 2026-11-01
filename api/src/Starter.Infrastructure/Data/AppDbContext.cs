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
    public DbSet<Workout> Workouts => Set<Workout>();
    public DbSet<WorkoutExercise> WorkoutExercises => Set<WorkoutExercise>();
    public DbSet<WorkoutSet> WorkoutSets => Set<WorkoutSet>();

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

        modelBuilder.Entity<Workout>(workout =>
        {
            workout.Property(w => w.Name).HasMaxLength(100);
            workout.Property(w => w.Notes).HasMaxLength(1000);
            workout.Property(w => w.Status).HasConversion<string>().HasMaxLength(20);

            workout.HasIndex(w => new { w.UserId, w.Status });

            // A user's workouts go with the user.
            workout.HasOne(w => w.User).WithMany().HasForeignKey(w => w.UserId).OnDelete(DeleteBehavior.Cascade);

            // Deleting a plan keeps the workouts started from it. SQL Server allows no cascade on a
            // self-reference, so WorkoutService clears SourcePlanId before it deletes a plan.
            workout.HasOne<Workout>().WithMany().HasForeignKey(w => w.SourcePlanId).OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<WorkoutExercise>(workoutExercise =>
        {
            workoutExercise.Property(we => we.Notes).HasMaxLength(1000);

            workoutExercise.HasOne<Workout>().WithMany(w => w.Exercises).HasForeignKey(we => we.WorkoutId).OnDelete(DeleteBehavior.Cascade);
            workoutExercise.HasOne(we => we.Exercise).WithMany().HasForeignKey(we => we.ExerciseId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<WorkoutSet>(set =>
        {
            set.Property(s => s.WeightKg).HasPrecision(6, 2);

            set.HasOne<WorkoutExercise>().WithMany(we => we.Sets).HasForeignKey(s => s.WorkoutExerciseId).OnDelete(DeleteBehavior.Cascade);
        });
    }
}
