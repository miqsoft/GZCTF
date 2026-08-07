namespace GZCTF.Models.Request.Edit;

/// <summary>
/// A reusable registration code generated for a game (Edit)
/// </summary>
public class RegistrationCodeInfoModel
{
    /// <summary>
    /// The code itself
    /// </summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// Game ID this code is tied to
    /// </summary>
    public int GameId { get; set; }

    /// <summary>
    /// ID of the user who generated this code
    /// </summary>
    public Guid CreatedByUserId { get; set; }

    /// <summary>
    /// When this code was generated
    /// </summary>
    public DateTimeOffset CreatedAtUtc { get; set; }

    internal static RegistrationCodeInfoModel FromRegistrationCode(RegistrationCode code) =>
        new()
        {
            Code = code.Code,
            GameId = code.GameId,
            CreatedByUserId = code.CreatedByUserId,
            CreatedAtUtc = code.CreatedAtUtc
        };
}
