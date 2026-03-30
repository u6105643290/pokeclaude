// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ClaudeToken
 * @author PokeClaude Team
 * @notice ERC-20 token used as the in-game currency for the PokeClaude
 *         ecosystem. Players earn CLAUDE through battles and spend it on
 *         marketplace purchases, item upgrades, and more.
 * @dev The owner (deployer / game server) can mint reward tokens. Any holder
 *      can burn their own tokens via the inherited ERC20Burnable interface.
 */
contract ClaudeToken is ERC20, ERC20Burnable, Ownable {
    // -----------------------------------------------------------------------
    //  Constants
    // -----------------------------------------------------------------------

    /// @notice Maximum total supply cap (1 billion tokens).
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10 ** 18;

    // -----------------------------------------------------------------------
    //  State
    // -----------------------------------------------------------------------

    /// @notice Addresses authorised to mint reward tokens (e.g. BattleSystem).
    mapping(address => bool) public authorizedMinters;

    // -----------------------------------------------------------------------
    //  Events
    // -----------------------------------------------------------------------

    /// @notice Emitted when an authorised minter is added or removed.
    event AuthorizedMinterUpdated(address indexed minter, bool authorized);

    // -----------------------------------------------------------------------
    //  Errors
    // -----------------------------------------------------------------------

    error ExceedsMaxSupply();
    error NotAuthorizedMinter();

    // -----------------------------------------------------------------------
    //  Constructor
    // -----------------------------------------------------------------------

    /**
     * @notice Deploys the token with an initial supply of 100 million CLAUDE
     *         minted to the deployer.
     */
    constructor() ERC20("ClaudeCoin", "CLAUDE") {
        _mint(msg.sender, 100_000_000 * 10 ** decimals());
    }

    // -----------------------------------------------------------------------
    //  External — Minting
    // -----------------------------------------------------------------------

    /**
     * @notice Mint new tokens to a recipient. Restricted to the owner.
     * @param to     Recipient address.
     * @param amount Amount of tokens to mint (in wei).
     */
    function mint(address to, uint256 amount) external onlyOwner {
        if (totalSupply() + amount > MAX_SUPPLY) revert ExceedsMaxSupply();
        _mint(to, amount);
    }

    /**
     * @notice Mint reward tokens from an authorised game contract
     *         (e.g. BattleSystem distributing battle rewards).
     * @param to     Recipient address.
     * @param amount Amount of tokens to mint (in wei).
     */
    function mintReward(address to, uint256 amount) external {
        if (!authorizedMinters[msg.sender]) revert NotAuthorizedMinter();
        if (totalSupply() + amount > MAX_SUPPLY) revert ExceedsMaxSupply();
        _mint(to, amount);
    }

    // -----------------------------------------------------------------------
    //  External — Admin
    // -----------------------------------------------------------------------

    /**
     * @notice Authorise or revoke an address as a reward minter.
     * @param _minter    The address to update.
     * @param _authorized Whether to grant or revoke minting rights.
     */
    function setAuthorizedMinter(
        address _minter,
        bool _authorized
    ) external onlyOwner {
        authorizedMinters[_minter] = _authorized;
        emit AuthorizedMinterUpdated(_minter, _authorized);
    }
}
