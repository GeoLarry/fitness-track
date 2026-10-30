namespace Starter.Infrastructure.Data;

// Built-in role names: the single source of truth for the seeder and the services.
public static class SystemRoles
{
    public const string SuperAdmin = "Super Admin";
    public const string Administrator = "Administrator";
    public const string User = "User";

    // Trains other users. For now the same access as User; coaching features add to it.
    public const string Coach = "Coach";

    // Role given automatically on public self-registration: the lowest level of access.
    public const string DefaultSelfRegister = User;
}
