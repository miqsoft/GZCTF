namespace GZCTF.Repositories.Interface;

public interface IRegistrationCodeRepository : IRepository
{
    /// <summary>
    /// Generate a new reusable registration code for a game
    /// </summary>
    /// <param name="game"></param>
    /// <param name="creator"></param>
    /// <param name="token"></param>
    /// <returns></returns>
    Task<RegistrationCode> Create(Game game, UserInfo creator, CancellationToken token = default);

    /// <summary>
    /// Resolve a registration code
    /// </summary>
    /// <param name="code"></param>
    /// <param name="token"></param>
    /// <returns></returns>
    Task<RegistrationCode?> GetByCode(string code, CancellationToken token = default);

    /// <summary>
    /// Get the registration codes generated for a game
    /// </summary>
    /// <param name="gameId"></param>
    /// <param name="token"></param>
    /// <returns></returns>
    Task<RegistrationCode[]> GetCodesForGame(int gameId, CancellationToken token = default);

    /// <summary>
    /// Revoke a registration code, scoped to a game so a manager cannot revoke another
    /// game's code by guessing its string
    /// </summary>
    /// <param name="code"></param>
    /// <param name="gameId"></param>
    /// <param name="token"></param>
    /// <returns> Whether a code was found and revoked </returns>
    Task<bool> Revoke(string code, int gameId, CancellationToken token = default);
}
