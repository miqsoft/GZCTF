using GZCTF.Repositories.Interface;
using Microsoft.EntityFrameworkCore;

namespace GZCTF.Repositories;

public class GameAdminRepository(AppDbContext context) : RepositoryBase(context), IGameAdminRepository
{
    public Task<bool> IsGameAdmin(Guid userId, int gameId, CancellationToken token = default) =>
        Context.GameAdmins.AnyAsync(a => a.UserId == userId && a.GameId == gameId, token);

    public async Task<GameAdmin> GrantAdmin(Game game, UserInfo user, CancellationToken token = default)
    {
        var existing = await Context.GameAdmins
            .SingleOrDefaultAsync(a => a.UserId == user.Id && a.GameId == game.Id, token);

        if (existing is not null)
            return existing;

        var admin = new GameAdmin(user, game);
        await Context.AddAsync(admin, token);
        await SaveAsync(token);

        return admin;
    }

    public async Task<bool> RevokeAdmin(int gameId, Guid userId, CancellationToken token = default)
    {
        var existing = await Context.GameAdmins
            .SingleOrDefaultAsync(a => a.UserId == userId && a.GameId == gameId, token);

        if (existing is null)
            return false;

        Context.Remove(existing);
        await SaveAsync(token);

        return true;
    }

    public Task<int[]> GetGameIdsForUser(Guid userId, CancellationToken token = default) =>
        Context.GameAdmins.Where(a => a.UserId == userId).Select(a => a.GameId).ToArrayAsync(token);

    public Task<UserInfo[]> GetAdmins(int gameId, CancellationToken token = default) =>
        Context.GameAdmins.Where(a => a.GameId == gameId).Select(a => a.User).ToArrayAsync(token);
}
