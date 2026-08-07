using System.Security.Cryptography;
using GZCTF.Models;
using GZCTF.Repositories.Interface;
using Microsoft.EntityFrameworkCore;

namespace GZCTF.Repositories;

public class RegistrationCodeRepository(AppDbContext context) : RepositoryBase(context), IRegistrationCodeRepository
{
    const string CodeChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ23456789";

    public async Task<RegistrationCode> Create(Game game, UserInfo creator, CancellationToken token = default)
    {
        string code;
        do
        {
            code = RandomNumberGenerator.GetString(CodeChars, Limits.RegistrationCodeLength);
        } while (await Context.RegistrationCodes.AnyAsync(c => c.Code == code, token));

        var entity = new RegistrationCode(code, game, creator);
        await Context.AddAsync(entity, token);
        await SaveAsync(token);

        return entity;
    }

    public Task<RegistrationCode?> GetByCode(string code, CancellationToken token = default) =>
        Context.RegistrationCodes.SingleOrDefaultAsync(c => c.Code == code, token);

    public Task<RegistrationCode[]> GetCodesForGame(int gameId, CancellationToken token = default) =>
        Context.RegistrationCodes.Where(c => c.GameId == gameId)
            .OrderByDescending(c => c.CreatedAtUtc).ToArrayAsync(token);

    public async Task<bool> Revoke(string code, int gameId, CancellationToken token = default)
    {
        var existing = await Context.RegistrationCodes
            .SingleOrDefaultAsync(c => c.Code == code && c.GameId == gameId, token);

        if (existing is null)
            return false;

        Context.Remove(existing);
        await SaveAsync(token);

        return true;
    }
}
