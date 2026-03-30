// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title PokeClaudeNFT
 * @author PokeClaude Team
 * @notice ERC-721 NFT contract for PokeClaude creatures with on-chain stats,
 *         leveling, and evolution mechanics.
 * @dev Each token represents a unique creature whose stats are stored on-chain.
 *      Creatures gain experience, level up, and evolve at levels 16 and 36.
 */
contract PokeClaudeNFT is ERC721, ERC721Enumerable, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;

    // -----------------------------------------------------------------------
    //  Constants
    // -----------------------------------------------------------------------

    /// @notice Price to mint a new creature (0.01 MATIC / ETH).
    uint256 public constant MINT_PRICE = 0.01 ether;

    /// @notice Hard cap on total supply.
    uint256 public constant MAX_SUPPLY = 10_000;

    /// @notice Experience required per level (simplified linear curve).
    uint256 public constant EXP_PER_LEVEL = 100;

    /// @notice Maximum level a creature can reach.
    uint256 public constant MAX_LEVEL = 100;

    /// @notice First evolution threshold.
    uint256 public constant EVOLUTION_STAGE_2_LEVEL = 16;

    /// @notice Second evolution threshold.
    uint256 public constant EVOLUTION_STAGE_3_LEVEL = 36;

    // -----------------------------------------------------------------------
    //  Types
    // -----------------------------------------------------------------------

    /**
     * @notice The eight creature archetypes in the PokeClaude universe.
     * @dev Stored as uint8 in the Creature struct for gas efficiency.
     *
     *  0 = DeFi      | 1 = AI       | 2 = Meme    | 3 = Layer1
     *  4 = NFT       | 5 = Privacy  | 6 = Oracle  | 7 = Gaming
     */
    uint8 public constant TYPE_DEFI    = 0;
    uint8 public constant TYPE_AI      = 1;
    uint8 public constant TYPE_MEME    = 2;
    uint8 public constant TYPE_LAYER1  = 3;
    uint8 public constant TYPE_NFT     = 4;
    uint8 public constant TYPE_PRIVACY = 5;
    uint8 public constant TYPE_ORACLE  = 6;
    uint8 public constant TYPE_GAMING  = 7;

    /**
     * @notice Full stat block for a PokeClaude creature.
     * @param name           Player-chosen name for the creature.
     * @param creatureType   Archetype index (0-7).
     * @param level          Current level (1-100).
     * @param hp             Hit points.
     * @param attack         Physical attack stat.
     * @param defense        Physical defense stat.
     * @param speed          Speed stat (determines turn order in battles).
     * @param specialAttack  Special attack stat.
     * @param specialDefense Special defense stat.
     * @param experience     Accumulated experience points.
     * @param evolutionStage Current evolution stage (1, 2, or 3).
     */
    struct Creature {
        string name;
        uint8 creatureType;
        uint16 level;
        uint16 hp;
        uint16 attack;
        uint16 defense;
        uint16 speed;
        uint16 specialAttack;
        uint16 specialDefense;
        uint256 experience;
        uint8 evolutionStage;
    }

    // -----------------------------------------------------------------------
    //  State
    // -----------------------------------------------------------------------

    Counters.Counter private _tokenIds;

    /// @notice Mapping from token ID to its on-chain creature data.
    mapping(uint256 => Creature) private _creatures;

    /// @notice Addresses authorised to grant experience (e.g. BattleSystem).
    mapping(address => bool) public authorizedContracts;

    // -----------------------------------------------------------------------
    //  Events
    // -----------------------------------------------------------------------

    /// @notice Emitted when a new creature is minted.
    event CreatureMinted(
        uint256 indexed tokenId,
        address indexed owner,
        string name,
        uint8 creatureType
    );

    /// @notice Emitted when a creature levels up.
    event CreatureLeveledUp(uint256 indexed tokenId, uint16 newLevel);

    /// @notice Emitted when a creature evolves to a new stage.
    event CreatureEvolved(uint256 indexed tokenId, uint8 newStage);

    /// @notice Emitted when experience is added to a creature.
    event ExperienceGained(uint256 indexed tokenId, uint256 amount, uint256 totalExp);

    /// @notice Emitted when an authorised contract is added or removed.
    event AuthorizedContractUpdated(address indexed contractAddress, bool authorized);

    // -----------------------------------------------------------------------
    //  Errors
    // -----------------------------------------------------------------------

    error MaxSupplyReached();
    error InsufficientPayment();
    error InvalidCreatureType();
    error MaxLevelReached();
    error AlreadyFullyEvolved();
    error NotReadyToEvolve();
    error NotOwnerOrAuthorized();
    error InvalidName();
    error WithdrawFailed();

    // -----------------------------------------------------------------------
    //  Modifiers
    // -----------------------------------------------------------------------

    /**
     * @dev Restricts calls to the token owner or an authorised game contract.
     */
    modifier onlyOwnerOrAuthorized(uint256 tokenId) {
        if (ownerOf(tokenId) != msg.sender && !authorizedContracts[msg.sender]) {
            revert NotOwnerOrAuthorized();
        }
        _;
    }

    // -----------------------------------------------------------------------
    //  Constructor
    // -----------------------------------------------------------------------

    constructor() ERC721("PokeClaude", "PKCL") {}

    // -----------------------------------------------------------------------
    //  External / Public — Minting
    // -----------------------------------------------------------------------

    /**
     * @notice Mint a new creature by paying the mint price.
     * @param _name         The name for the new creature.
     * @param _creatureType The archetype index (0-7).
     * @return tokenId      The ID of the newly minted token.
     */
    function mintCreature(
        string calldata _name,
        uint8 _creatureType
    ) external payable nonReentrant returns (uint256) {
        if (msg.value < MINT_PRICE) revert InsufficientPayment();
        return _mintInternal(msg.sender, _name, _creatureType);
    }

    /**
     * @notice Owner-only free mint (e.g. for airdrops or rewards).
     * @param _to           Recipient address.
     * @param _name         The name for the new creature.
     * @param _creatureType The archetype index (0-7).
     * @return tokenId      The ID of the newly minted token.
     */
    function ownerMint(
        address _to,
        string calldata _name,
        uint8 _creatureType
    ) external onlyOwner returns (uint256) {
        return _mintInternal(_to, _name, _creatureType);
    }

    // -----------------------------------------------------------------------
    //  External / Public — Gameplay
    // -----------------------------------------------------------------------

    /**
     * @notice Add experience points to a creature. Automatically levels up
     *         when enough experience is accumulated.
     * @dev Callable by the token owner or an authorised contract (e.g. BattleSystem).
     * @param tokenId The creature to award experience to.
     * @param amount  The amount of experience to grant.
     */
    function addExperience(
        uint256 tokenId,
        uint256 amount
    ) external onlyOwnerOrAuthorized(tokenId) {
        Creature storage creature = _creatures[tokenId];
        if (creature.level >= MAX_LEVEL) revert MaxLevelReached();

        creature.experience += amount;
        emit ExperienceGained(tokenId, amount, creature.experience);

        // Auto level-up loop
        while (
            creature.level < MAX_LEVEL &&
            creature.experience >= uint256(creature.level) * EXP_PER_LEVEL
        ) {
            creature.experience -= uint256(creature.level) * EXP_PER_LEVEL;
            _levelUp(tokenId);
        }
    }

    /**
     * @notice Evolve a creature to its next stage when it meets the level
     *         requirement.
     * @param tokenId The creature to evolve.
     */
    function evolve(uint256 tokenId) external onlyOwnerOrAuthorized(tokenId) {
        Creature storage creature = _creatures[tokenId];
        if (creature.evolutionStage >= 3) revert AlreadyFullyEvolved();

        if (creature.evolutionStage == 1 && creature.level < EVOLUTION_STAGE_2_LEVEL) {
            revert NotReadyToEvolve();
        }
        if (creature.evolutionStage == 2 && creature.level < EVOLUTION_STAGE_3_LEVEL) {
            revert NotReadyToEvolve();
        }

        creature.evolutionStage += 1;

        // Evolution stat boost: +10 to every stat
        creature.hp += 10;
        creature.attack += 10;
        creature.defense += 10;
        creature.speed += 10;
        creature.specialAttack += 10;
        creature.specialDefense += 10;

        emit CreatureEvolved(tokenId, creature.evolutionStage);
    }

    // -----------------------------------------------------------------------
    //  External — Admin
    // -----------------------------------------------------------------------

    /**
     * @notice Authorise or revoke a game contract (e.g. BattleSystem) so it
     *         can modify creature stats.
     * @param _contract  The contract address.
     * @param _authorized Whether to grant or revoke authorisation.
     */
    function setAuthorizedContract(
        address _contract,
        bool _authorized
    ) external onlyOwner {
        authorizedContracts[_contract] = _authorized;
        emit AuthorizedContractUpdated(_contract, _authorized);
    }

    /**
     * @notice Withdraw accumulated mint fees to the owner.
     */
    function withdraw() external onlyOwner {
        (bool success, ) = payable(owner()).call{value: address(this).balance}("");
        if (!success) revert WithdrawFailed();
    }

    // -----------------------------------------------------------------------
    //  External — Views
    // -----------------------------------------------------------------------

    /**
     * @notice Retrieve the full stat block for a creature.
     * @param tokenId The token to query.
     * @return creature The Creature struct with all stats.
     */
    function getCreatureStats(
        uint256 tokenId
    ) external view returns (Creature memory) {
        _requireMinted(tokenId);
        return _creatures[tokenId];
    }

    /**
     * @notice Total number of creatures minted so far.
     */
    function totalMinted() external view returns (uint256) {
        return _tokenIds.current();
    }

    // -----------------------------------------------------------------------
    //  Internal helpers
    // -----------------------------------------------------------------------

    /**
     * @dev Shared minting logic used by both public and owner mints.
     */
    function _mintInternal(
        address _to,
        string calldata _name,
        uint8 _creatureType
    ) internal returns (uint256) {
        if (_tokenIds.current() >= MAX_SUPPLY) revert MaxSupplyReached();
        if (_creatureType > TYPE_GAMING) revert InvalidCreatureType();
        if (bytes(_name).length == 0 || bytes(_name).length > 32) revert InvalidName();

        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _safeMint(_to, newTokenId);

        // Generate pseudo-random base stats seeded by on-chain entropy.
        (
            uint16 hp,
            uint16 atk,
            uint16 def,
            uint16 spd,
            uint16 spAtk,
            uint16 spDef
        ) = _generateBaseStats(newTokenId, _creatureType);

        _creatures[newTokenId] = Creature({
            name: _name,
            creatureType: _creatureType,
            level: 1,
            hp: hp,
            attack: atk,
            defense: def,
            speed: spd,
            specialAttack: spAtk,
            specialDefense: spDef,
            experience: 0,
            evolutionStage: 1
        });

        emit CreatureMinted(newTokenId, _to, _name, _creatureType);
        return newTokenId;
    }

    /**
     * @dev Derive pseudo-random base stats in the range [30, 80] influenced
     *      by creature type.
     */
    function _generateBaseStats(
        uint256 tokenId,
        uint8 creatureType
    )
        internal
        view
        returns (
            uint16 hp,
            uint16 atk,
            uint16 def,
            uint16 spd,
            uint16 spAtk,
            uint16 spDef
        )
    {
        uint256 seed = uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    block.prevrandao,
                    msg.sender,
                    tokenId
                )
            )
        );

        hp    = 30 + uint16((seed >> 0)  % 51);  // 30-80
        atk   = 30 + uint16((seed >> 16) % 51);
        def   = 30 + uint16((seed >> 32) % 51);
        spd   = 30 + uint16((seed >> 48) % 51);
        spAtk = 30 + uint16((seed >> 64) % 51);
        spDef = 30 + uint16((seed >> 80) % 51);

        // Type-based bonus: each archetype excels in a different stat.
        if (creatureType == TYPE_DEFI)    def   += 10;
        if (creatureType == TYPE_AI)      spAtk += 10;
        if (creatureType == TYPE_MEME)    spd   += 10;
        if (creatureType == TYPE_LAYER1)  hp    += 10;
        if (creatureType == TYPE_NFT)     atk   += 10;
        if (creatureType == TYPE_PRIVACY) spDef += 10;
        if (creatureType == TYPE_ORACLE)  spAtk += 10;
        if (creatureType == TYPE_GAMING)  spd   += 10;
    }

    /**
     * @dev Increment a creature's level by one and apply stat gains.
     */
    function _levelUp(uint256 tokenId) internal {
        Creature storage creature = _creatures[tokenId];
        creature.level += 1;

        // Stat growth per level: +2 to each stat
        creature.hp += 2;
        creature.attack += 2;
        creature.defense += 2;
        creature.speed += 2;
        creature.specialAttack += 2;
        creature.specialDefense += 2;

        emit CreatureLeveledUp(tokenId, creature.level);
    }

    /**
     * @dev Check whether a token has been minted (exists).
     */
    function _requireMinted(uint256 tokenId) internal view {
        require(_exists(tokenId), "PokeClaudeNFT: nonexistent token");
    }

    // -----------------------------------------------------------------------
    //  Overrides required by Solidity for ERC721 + ERC721Enumerable
    // -----------------------------------------------------------------------

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
