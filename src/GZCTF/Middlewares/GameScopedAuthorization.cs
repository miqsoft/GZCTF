using System.Security.Claims;
using GZCTF.Models.Data;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;
using Serilog;

namespace GZCTF.Middlewares;

/// <summary>
/// Where in the route a game-scoped authorization filter should resolve the game ID from
/// </summary>
public enum GameIdSource
{
    /// <summary>
    /// The route directly carries the game ID, e.g. <c>Games/{id:int}/...</c>
    /// </summary>
    Route,

    /// <summary>
    /// The route only carries a challenge ID, e.g. <c>Captures/{challengeId:int}/...</c>;
    /// the game ID is resolved via <see cref="GameChallenge.GameId" />
    /// </summary>
    ChallengeRoute
}

/// <summary>
/// Authorization filter for game-scoped privilege: grants access if the user holds the
/// required global <see cref="Role" />, OR is a <see cref="GameAdmin" /> for the game
/// resolved from the current route.
/// </summary>
/// <param name="privilege"> The global privilege that bypasses game scoping </param>
/// <param name="routeParam"> The route parameter name carrying the ID used to resolve the game </param>
/// <param name="source"> How to resolve the game ID from <paramref name="routeParam" /> </param>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class RequireGameScopedPrivilegeAttribute(Role privilege, string routeParam = "id",
    GameIdSource source = GameIdSource.Route) : Attribute, IAsyncAuthorizationFilter
{
    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        var logger =
            context.HttpContext.RequestServices.GetRequiredService<ILogger<RequireGameScopedPrivilegeAttribute>>();
        var dbContext = context.HttpContext.RequestServices.GetRequiredService<AppDbContext>();
        var localizer =
            context.HttpContext.RequestServices.GetRequiredService<IStringLocalizer<Program>>();
        var diagnosticContext =
            context.HttpContext.RequestServices.GetRequiredService<IDiagnosticContext>();

        var id = context.HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);

        UserInfo? user = null;

        if (id is not null && context.HttpContext.User.Identity?.IsAuthenticated is true &&
            Guid.TryParse(id, out var guid))
            user = await dbContext.Users.SingleOrDefaultAsync(u => u.Id == guid);

        if (user is null)
        {
            context.Result = RequestResponse.Result(localizer[nameof(Resources.Program.Auth_LoginRequired)],
                StatusCodes.Status401Unauthorized);
            return;
        }

        diagnosticContext.Set("UserId", user.Id);
        diagnosticContext.Set("UserName", user.UserName ?? "Anonymous");

        if (context.HttpContext.Connection.RemoteIpAddress is { } ip)
            diagnosticContext.Set("IP", ip);

        if (DateTimeOffset.UtcNow - user.LastVisitedUtc > TimeSpan.FromSeconds(5))
        {
            user.UpdateByHttpContext(context.HttpContext);
            await dbContext.SaveChangesAsync(); // avoid to update ConcurrencyStamp
        }

        if (user.Role >= privilege)
            return;

        var gameId = await ResolveGameId(context, dbContext, routeParam, source);

        if (gameId is not null &&
            await dbContext.GameAdmins.AnyAsync(a => a.UserId == user.Id && a.GameId == gameId))
            return;

        logger.Log(
            StaticLocalizer[nameof(Resources.Program.Auth_PathAccessForbidden),
                context.HttpContext.Request.Path], user,
            TaskStatus.Denied);

        context.Result = RequestResponse.Result(localizer[nameof(Resources.Program.Auth_AccessForbidden)],
            StatusCodes.Status403Forbidden);
    }

    static async Task<int?> ResolveGameId(AuthorizationFilterContext context, AppDbContext dbContext,
        string routeParam, GameIdSource source)
    {
        if (!context.RouteData.Values.TryGetValue(routeParam, out var raw) ||
            !int.TryParse(raw?.ToString(), out var value))
            return null;

        if (source is GameIdSource.Route)
            return value;

        // ChallengeRoute: `value` is a challenge ID, resolve its owning game
        return await dbContext.GameChallenges
            .Where(c => c.Id == value)
            .Select(c => (int?)c.GameId)
            .SingleOrDefaultAsync();
    }
}

/// <summary>
/// Game-scoped monitor privilege required: global Monitor/Admin, or a <see cref="GameAdmin" />
/// for the game resolved from the route
/// </summary>
public class RequireGameMonitorAttribute(string routeParam = "id", GameIdSource source = GameIdSource.Route)
    : RequireGameScopedPrivilegeAttribute(Role.Monitor, routeParam, source);

/// <summary>
/// Game-scoped admin privilege required: global Admin, or a <see cref="GameAdmin" />
/// for the game resolved from the route
/// </summary>
public class RequireGameAdminAttribute(string routeParam = "id", GameIdSource source = GameIdSource.Route)
    : RequireGameScopedPrivilegeAttribute(Role.Admin, routeParam, source);
