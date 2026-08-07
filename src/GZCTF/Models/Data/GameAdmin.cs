using System.ComponentModel.DataAnnotations;

namespace GZCTF.Models.Data;

/// <summary>
/// Grants a user (not necessarily a global Admin/Monitor) scoped admin access to a single game
/// </summary>
public class GameAdmin
{
    public GameAdmin() { }

    public GameAdmin(UserInfo user, Game game)
    {
        User = user;
        Game = game;
    }

    /// <summary>
    /// User ID
    /// </summary>
    [Required]
    public Guid UserId { get; set; }

    /// <summary>
    /// User
    /// </summary>
    public UserInfo User { get; set; } = null!;

    /// <summary>
    /// Game ID
    /// </summary>
    [Required]
    public int GameId { get; set; }

    /// <summary>
    /// Game
    /// </summary>
    public Game Game { get; set; } = null!;
}
