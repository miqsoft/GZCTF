namespace GZCTF.Repositories.Interface;

public interface IGameAdminRepository : IRepository
{
    /// <summary>
    /// Check whether a user is a scoped game admin for a specific game
    /// </summary>
    /// <param name="userId"></param>
    /// <param name="gameId"></param>
    /// <param name="token"></param>
    /// <returns></returns>
    Task<bool> IsGameAdmin(Guid userId, int gameId, CancellationToken token = default);

    /// <summary>
    /// Grant a user scoped game admin access to a game
    /// </summary>
    /// <param name="game"></param>
    /// <param name="user"></param>
    /// <param name="token"></param>
    /// <returns></returns>
    Task<GameAdmin> GrantAdmin(Game game, UserInfo user, CancellationToken token = default);

    /// <summary>
    /// Revoke a user's scoped game admin access to a game
    /// </summary>
    /// <param name="gameId"></param>
    /// <param name="userId"></param>
    /// <param name="token"></param>
    /// <returns> Whether a grant was found and revoked </returns>
    Task<bool> RevokeAdmin(int gameId, Guid userId, CancellationToken token = default);

    /// <summary>
    /// Get the IDs of games a user has been granted scoped admin access to
    /// </summary>
    /// <param name="userId"></param>
    /// <param name="token"></param>
    /// <returns></returns>
    Task<int[]> GetGameIdsForUser(Guid userId, CancellationToken token = default);
}
