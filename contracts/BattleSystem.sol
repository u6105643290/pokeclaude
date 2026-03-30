// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title IBattleNFT
 * @notice Minimal interface for the PokeClaudeNFT contract used by the
 *         battle system.
 */
interface IBattleNFT {
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

    function getCreatureStats(uint256 tokenId) external view returns (Creature memory);
    function ownerOf(uint256 tokenId) external view returns (address);
    function addExperience(uint256 tokenId, uint256 amount) external;
}

/**
 * @title IBattleToken
 * @notice Minimal interface for the ClaudeToken contract used by the
 *         battle system to distribute rewards.
 */
interface IBattleToken {
    function mintReward(address to, uint256 amount) external;
}

/**
 * @title BattleSystem
 * @author PokeClaude Team
 * @notice On-chain PvP battle system for PokeClaude creatures. Players
 *         challenge each other, and a simplified stat-based resolution
 *         determines the winner. Winners receive CLAUDE token rewards and
 *         experience for their creature.
 * @dev Uses pseudo-randomness from block data for battle variance. This is
 *      acceptable for a game context but should not be used for high-stakes
 *      financial outcomes. For production VRF integration (e.g. Chainlink
 *      VRF) is recommended.
 */
contract BattleSystem is Ownable, ReentrancyGuard {
    // -----------------------------------------------------------------------
    //  Constants
    // -----------------------------------------------------------------------

    /// @notice CLAUDE tokens awarded to the battle winner.
    uint256 public constant BATTLE_REWARD = 10 * 10 ** 18;

    /// @notice Experience awarded to the winner's creature.
    uint256 public constant WINNER_EXP = 50;

    /// @notice Experience awarded to the loser's creature (consolation).
    uint256 public constant LOSER_EXP = 15;

    // -----------------------------------------------------------------------
    //  Types
    // -----------------------------------------------------------------------

    /// @notice Possible states for a challenge.
    enum ChallengeStatus {
        Pending,
        Accepted,
        Declined,
        Completed,
        Cancelled
    }

    /**
     * @notice A battle challenge between two players.
     * @param challengeId     Unique identifier.
     * @param challenger      Address of the player who issued the challenge.
     * @param opponent        Address of the challenged player.
     * @param challengerToken Token ID of the challenger's creature.
     * @param opponentToken   Token ID of the opponent's creature (set on accept).
     * @param status          Current status of the challenge.
     * @param winner          Address of the winner (set after resolution).
     * @param createdAt       Block timestamp when the challenge was created.
     */
    struct Challenge {
        uint256 challengeId;
        address challenger;
        address opponent;
        uint256 challengerToken;
        uint256 opponentToken;
        ChallengeStatus status;
        address winner;
        uint256 createdAt;
    }

    /**
     * @notice Win / loss record for a specific creature.
     * @param wins   Total victories.
     * @param losses Total defeats.
     */
    struct BattleRecord {
        uint256 wins;
        uint256 losses;
    }

    // -----------------------------------------------------------------------
    //  State
    // -----------------------------------------------------------------------

    /// @notice Reference to the PokeClaudeNFT contract.
    IBattleNFT public immutable nftContract;

    /// @notice Reference to the ClaudeToken contract.
    IBattleToken public immutable claudeToken;

    /// @notice Auto-incrementing challenge counter.
    uint256 public challengeCount;

    /// @notice Mapping from challenge ID to Challenge data.
    mapping(uint256 => Challenge) public challenges;

    /// @notice Mapping from creature token ID to its win/loss record.
    mapping(uint256 => BattleRecord) public battleRecords;

    /// @notice Timeout after which a pending challenge can be cancelled (1 day).
    uint256 public constant CHALLENGE_TIMEOUT = 1 days;

    // -----------------------------------------------------------------------
    //  Events
    // -----------------------------------------------------------------------

    /// @notice Emitted when a new challenge is created.
    event ChallengeCreated(
        uint256 indexed challengeId,
        address indexed challenger,
        address indexed opponent,
        uint256 challengerToken
    );

    /// @notice Emitted when a challenge is accepted and the battle begins.
    event ChallengeAccepted(
        uint256 indexed challengeId,
        address indexed opponent,
        uint256 opponentToken
    );

    /// @notice Emitted when a challenge is declined.
    event ChallengeDeclined(uint256 indexed challengeId, address indexed opponent);

    /// @notice Emitted when a challenge is cancelled (by challenger or timeout).
    event ChallengeCancelled(uint256 indexed challengeId);

    /// @notice Emitted when a battle is resolved with a winner.
    event BattleResolved(
        uint256 indexed challengeId,
        address indexed winner,
        address indexed loser,
        uint256 winnerToken,
        uint256 loserToken,
        uint256 winnerScore,
        uint256 loserScore
    );

    // -----------------------------------------------------------------------
    //  Errors
    // -----------------------------------------------------------------------

    error NotCreatureOwner();
    error CannotChallengeSelf();
    error ChallengeNotPending();
    error NotOpponent();
    error NotChallenger();
    error ChallengeNotExpired();
    error InvalidCreature();

    // -----------------------------------------------------------------------
    //  Constructor
    // -----------------------------------------------------------------------

    /**
     * @param _nftContract   Address of the deployed PokeClaudeNFT contract.
     * @param _claudeToken   Address of the deployed ClaudeToken contract.
     */
    constructor(address _nftContract, address _claudeToken) {
        nftContract = IBattleNFT(_nftContract);
        claudeToken = IBattleToken(_claudeToken);
    }

    // -----------------------------------------------------------------------
    //  External — Challenge lifecycle
    // -----------------------------------------------------------------------

    /**
     * @notice Create a battle challenge against another player.
     * @param _opponent        The address of the player to challenge.
     * @param _challengerToken Token ID of the creature the challenger will use.
     * @return challengeId     The ID of the newly created challenge.
     */
    function createChallenge(
        address _opponent,
        uint256 _challengerToken
    ) external returns (uint256) {
        if (msg.sender == _opponent) revert CannotChallengeSelf();
        if (nftContract.ownerOf(_challengerToken) != msg.sender) {
            revert NotCreatureOwner();
        }

        challengeCount++;
        uint256 newId = challengeCount;

        challenges[newId] = Challenge({
            challengeId: newId,
            challenger: msg.sender,
            opponent: _opponent,
            challengerToken: _challengerToken,
            opponentToken: 0,
            status: ChallengeStatus.Pending,
            winner: address(0),
            createdAt: block.timestamp
        });

        emit ChallengeCreated(newId, msg.sender, _opponent, _challengerToken);
        return newId;
    }

    /**
     * @notice Accept a pending challenge and immediately resolve the battle.
     * @param _challengeId The challenge to accept.
     * @param _opponentToken Token ID of the creature the opponent will use.
     */
    function acceptChallenge(
        uint256 _challengeId,
        uint256 _opponentToken
    ) external nonReentrant {
        Challenge storage challenge = challenges[_challengeId];
        if (challenge.status != ChallengeStatus.Pending) revert ChallengeNotPending();
        if (msg.sender != challenge.opponent) revert NotOpponent();
        if (nftContract.ownerOf(_opponentToken) != msg.sender) {
            revert NotCreatureOwner();
        }

        challenge.opponentToken = _opponentToken;
        challenge.status = ChallengeStatus.Accepted;

        emit ChallengeAccepted(_challengeId, msg.sender, _opponentToken);

        // Immediately resolve the battle
        _resolveBattle(_challengeId);
    }

    /**
     * @notice Decline a pending challenge.
     * @param _challengeId The challenge to decline.
     */
    function declineChallenge(uint256 _challengeId) external {
        Challenge storage challenge = challenges[_challengeId];
        if (challenge.status != ChallengeStatus.Pending) revert ChallengeNotPending();
        if (msg.sender != challenge.opponent) revert NotOpponent();

        challenge.status = ChallengeStatus.Declined;
        emit ChallengeDeclined(_challengeId, msg.sender);
    }

    /**
     * @notice Cancel a pending challenge. The challenger can cancel at any
     *         time, or anyone can cancel after the timeout period.
     * @param _challengeId The challenge to cancel.
     */
    function cancelChallenge(uint256 _challengeId) external {
        Challenge storage challenge = challenges[_challengeId];
        if (challenge.status != ChallengeStatus.Pending) revert ChallengeNotPending();

        if (msg.sender == challenge.challenger) {
            // Challenger can always cancel their own challenge
            challenge.status = ChallengeStatus.Cancelled;
        } else {
            // Anyone else can cancel only after timeout
            if (block.timestamp < challenge.createdAt + CHALLENGE_TIMEOUT) {
                revert ChallengeNotExpired();
            }
            challenge.status = ChallengeStatus.Cancelled;
        }

        emit ChallengeCancelled(_challengeId);
    }

    // -----------------------------------------------------------------------
    //  External — Views
    // -----------------------------------------------------------------------

    /**
     * @notice Retrieve the full details of a challenge.
     * @param _challengeId The challenge to query.
     * @return The Challenge struct.
     */
    function getChallenge(
        uint256 _challengeId
    ) external view returns (Challenge memory) {
        return challenges[_challengeId];
    }

    /**
     * @notice Retrieve the win/loss record for a creature.
     * @param _tokenId The creature token ID.
     * @return The BattleRecord struct.
     */
    function getBattleRecord(
        uint256 _tokenId
    ) external view returns (BattleRecord memory) {
        return battleRecords[_tokenId];
    }

    // -----------------------------------------------------------------------
    //  Internal — Battle resolution
    // -----------------------------------------------------------------------

    /**
     * @dev Resolve an accepted battle. Computes a battle score for each
     *      creature based on weighted stats plus a random modifier, then
     *      distributes rewards.
     *
     *      Score formula per creature:
     *        baseScore = (attack * 2) + (specialAttack * 2) + (speed * 1.5)
     *                  + (hp * 1) + (defense * 0.5) + (specialDefense * 0.5)
     *        finalScore = baseScore + random(0..49)
     *
     *      The creature with the higher finalScore wins. Ties go to the
     *      challenger (first-mover advantage).
     */
    function _resolveBattle(uint256 _challengeId) internal {
        Challenge storage challenge = challenges[_challengeId];

        IBattleNFT.Creature memory chal = nftContract.getCreatureStats(
            challenge.challengerToken
        );
        IBattleNFT.Creature memory opp = nftContract.getCreatureStats(
            challenge.opponentToken
        );

        // Calculate base battle scores
        uint256 chalScore = _calculateBattleScore(chal);
        uint256 oppScore  = _calculateBattleScore(opp);

        // Add type effectiveness bonus
        chalScore += _typeEffectiveness(chal.creatureType, opp.creatureType);
        oppScore  += _typeEffectiveness(opp.creatureType, chal.creatureType);

        // Add pseudo-random variance
        uint256 seed = uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    block.prevrandao,
                    challenge.challenger,
                    challenge.opponent,
                    _challengeId
                )
            )
        );
        chalScore += (seed % 50);
        oppScore  += ((seed >> 128) % 50);

        // Determine winner
        address winnerAddr;
        address loserAddr;
        uint256 winnerToken;
        uint256 loserToken;

        if (chalScore >= oppScore) {
            winnerAddr  = challenge.challenger;
            loserAddr   = challenge.opponent;
            winnerToken = challenge.challengerToken;
            loserToken  = challenge.opponentToken;
        } else {
            winnerAddr  = challenge.opponent;
            loserAddr   = challenge.challenger;
            winnerToken = challenge.opponentToken;
            loserToken  = challenge.challengerToken;
        }

        challenge.winner = winnerAddr;
        challenge.status = ChallengeStatus.Completed;

        // Update battle records
        battleRecords[winnerToken].wins++;
        battleRecords[loserToken].losses++;

        // Distribute rewards
        claudeToken.mintReward(winnerAddr, BATTLE_REWARD);

        // Grant experience (winner gets more)
        nftContract.addExperience(winnerToken, WINNER_EXP);
        nftContract.addExperience(loserToken, LOSER_EXP);

        emit BattleResolved(
            _challengeId,
            winnerAddr,
            loserAddr,
            winnerToken,
            loserToken,
            chalScore,
            oppScore
        );
    }

    /**
     * @dev Calculate the weighted battle score from a creature's stats.
     * @param creature The creature stats to evaluate.
     * @return score The computed battle score.
     */
    function _calculateBattleScore(
        IBattleNFT.Creature memory creature
    ) internal pure returns (uint256 score) {
        score =
            (uint256(creature.attack) * 2) +
            (uint256(creature.specialAttack) * 2) +
            ((uint256(creature.speed) * 3) / 2) +   // * 1.5
            uint256(creature.hp) +
            (uint256(creature.defense) / 2) +
            (uint256(creature.specialDefense) / 2);
    }

    /**
     * @dev Calculate a type-effectiveness bonus. Each type is strong against
     *      two others, granting a +20 bonus.
     *
     *      Type advantages:
     *        DeFi    > Meme, NFT
     *        AI      > Oracle, Gaming
     *        Meme    > AI, Privacy
     *        Layer1  > DeFi, Oracle
     *        NFT     > Gaming, AI
     *        Privacy > Layer1, DeFi
     *        Oracle  > Meme, NFT
     *        Gaming  > Privacy, Layer1
     *
     * @param attackerType The attacking creature's type.
     * @param defenderType The defending creature's type.
     * @return bonus The bonus to add (0 or 20).
     */
    function _typeEffectiveness(
        uint8 attackerType,
        uint8 defenderType
    ) internal pure returns (uint256 bonus) {
        // DeFi (0) beats Meme (2), NFT (4)
        if (attackerType == 0 && (defenderType == 2 || defenderType == 4)) return 20;
        // AI (1) beats Oracle (6), Gaming (7)
        if (attackerType == 1 && (defenderType == 6 || defenderType == 7)) return 20;
        // Meme (2) beats AI (1), Privacy (5)
        if (attackerType == 2 && (defenderType == 1 || defenderType == 5)) return 20;
        // Layer1 (3) beats DeFi (0), Oracle (6)
        if (attackerType == 3 && (defenderType == 0 || defenderType == 6)) return 20;
        // NFT (4) beats Gaming (7), AI (1)
        if (attackerType == 4 && (defenderType == 7 || defenderType == 1)) return 20;
        // Privacy (5) beats Layer1 (3), DeFi (0)
        if (attackerType == 5 && (defenderType == 3 || defenderType == 0)) return 20;
        // Oracle (6) beats Meme (2), NFT (4)
        if (attackerType == 6 && (defenderType == 2 || defenderType == 4)) return 20;
        // Gaming (7) beats Privacy (5), Layer1 (3)
        if (attackerType == 7 && (defenderType == 5 || defenderType == 3)) return 20;

        return 0;
    }
}
