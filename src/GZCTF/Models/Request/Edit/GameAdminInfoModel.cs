namespace GZCTF.Models.Request.Edit;

/// <summary>
/// A user with scoped admin access to a game (Edit) - deliberately minimal, exposing only
/// what a game-scoped manager needs to manage their own game's admin list, not the full PII
/// surface of <see cref="GZCTF.Models.Request.Admin.UserInfoModel" />
/// </summary>
public class GameAdminInfoModel
{
    /// <summary>
    /// User ID
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Username
    /// </summary>
    public string UserName { get; set; } = string.Empty;

    internal static GameAdminInfoModel FromUserInfo(UserInfo user) =>
        new() { Id = user.Id, UserName = user.UserName ?? string.Empty };
}
