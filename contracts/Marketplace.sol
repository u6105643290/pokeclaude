// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title Marketplace
 * @author PokeClaude Team
 * @notice Decentralised marketplace for trading PokeClaude NFT creatures.
 *         Sellers can list creatures for sale priced in native currency (ETH /
 *         MATIC) or in ClaudeToken (CLAUDE). A 2.5 % fee is collected on every
 *         successful sale.
 * @dev The marketplace escrows the NFT on listing and returns it on
 *      cancellation. Fees accumulate in the contract and can be withdrawn by
 *      the owner.
 */
contract Marketplace is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using Counters for Counters.Counter;

    // -----------------------------------------------------------------------
    //  Constants
    // -----------------------------------------------------------------------

    /// @notice Fee percentage in basis points (250 = 2.5 %).
    uint256 public constant FEE_BPS = 250;

    /// @notice Basis-points denominator.
    uint256 public constant BPS_DENOMINATOR = 10_000;

    // -----------------------------------------------------------------------
    //  Types
    // -----------------------------------------------------------------------

    /// @notice Payment method for a listing.
    enum PaymentType {
        ETH,
        CLAUDE_TOKEN
    }

    /**
     * @notice A marketplace listing.
     * @param listingId   Unique listing identifier.
     * @param seller      Address that listed the creature.
     * @param nftContract Address of the NFT contract.
     * @param tokenId     NFT token ID.
     * @param price       Asking price (in wei for ETH, in token-wei for CLAUDE).
     * @param paymentType Whether the seller wants ETH or CLAUDE.
     * @param active      Whether the listing is still available.
     */
    struct Listing {
        uint256 listingId;
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 price;
        PaymentType paymentType;
        bool active;
    }

    // -----------------------------------------------------------------------
    //  State
    // -----------------------------------------------------------------------

    /// @notice The ClaudeToken contract used for token-based payments.
    IERC20 public immutable claudeToken;

    /// @notice Auto-incrementing listing counter.
    Counters.Counter private _listingIds;

    /// @notice Mapping from listing ID to Listing data.
    mapping(uint256 => Listing) public listings;

    /// @notice Accumulated ETH fees available for withdrawal.
    uint256 public accumulatedEthFees;

    /// @notice Accumulated CLAUDE token fees available for withdrawal.
    uint256 public accumulatedTokenFees;

    // -----------------------------------------------------------------------
    //  Events
    // -----------------------------------------------------------------------

    /// @notice Emitted when a creature is listed for sale.
    event Listed(
        uint256 indexed listingId,
        address indexed seller,
        address indexed nftContract,
        uint256 tokenId,
        uint256 price,
        PaymentType paymentType
    );

    /// @notice Emitted when a listed creature is purchased.
    event Sold(
        uint256 indexed listingId,
        address indexed buyer,
        address indexed seller,
        uint256 tokenId,
        uint256 price,
        uint256 fee,
        PaymentType paymentType
    );

    /// @notice Emitted when a listing is cancelled by the seller.
    event ListingCancelled(uint256 indexed listingId, address indexed seller);

    /// @notice Emitted when the owner withdraws accumulated fees.
    event FeesWithdrawn(address indexed to, uint256 ethAmount, uint256 tokenAmount);

    // -----------------------------------------------------------------------
    //  Errors
    // -----------------------------------------------------------------------

    error PriceMustBePositive();
    error ListingNotActive();
    error NotSeller();
    error InsufficientPayment();
    error WithdrawFailed();
    error CannotBuyOwnListing();

    // -----------------------------------------------------------------------
    //  Constructor
    // -----------------------------------------------------------------------

    /**
     * @param _claudeToken Address of the deployed ClaudeToken contract.
     */
    constructor(address _claudeToken) {
        claudeToken = IERC20(_claudeToken);
    }

    // -----------------------------------------------------------------------
    //  External — Listing management
    // -----------------------------------------------------------------------

    /**
     * @notice List a PokeClaude creature for sale. The NFT is transferred into
     *         escrow in this contract.
     * @dev Caller must have approved this contract to transfer the NFT before
     *      calling this function.
     * @param _nftContract Address of the PokeClaudeNFT contract.
     * @param _tokenId     Token ID of the creature to sell.
     * @param _price       Asking price (in wei or token-wei).
     * @param _paymentType Whether to accept ETH or CLAUDE.
     * @return listingId   The ID of the new listing.
     */
    function listCreature(
        address _nftContract,
        uint256 _tokenId,
        uint256 _price,
        PaymentType _paymentType
    ) external nonReentrant returns (uint256) {
        if (_price == 0) revert PriceMustBePositive();

        // Transfer NFT into escrow
        IERC721(_nftContract).transferFrom(msg.sender, address(this), _tokenId);

        _listingIds.increment();
        uint256 newListingId = _listingIds.current();

        listings[newListingId] = Listing({
            listingId: newListingId,
            seller: msg.sender,
            nftContract: _nftContract,
            tokenId: _tokenId,
            price: _price,
            paymentType: _paymentType,
            active: true
        });

        emit Listed(
            newListingId,
            msg.sender,
            _nftContract,
            _tokenId,
            _price,
            _paymentType
        );

        return newListingId;
    }

    /**
     * @notice Purchase a listed creature.
     * @dev For ETH listings send the exact price as msg.value. For CLAUDE
     *      listings the buyer must have approved this contract to spend the
     *      required amount.
     * @param _listingId The ID of the listing to purchase.
     */
    function buyCreature(uint256 _listingId) external payable nonReentrant {
        Listing storage listing = listings[_listingId];
        if (!listing.active) revert ListingNotActive();
        if (msg.sender == listing.seller) revert CannotBuyOwnListing();

        listing.active = false;

        uint256 fee = (listing.price * FEE_BPS) / BPS_DENOMINATOR;
        uint256 sellerProceeds = listing.price - fee;

        if (listing.paymentType == PaymentType.ETH) {
            if (msg.value < listing.price) revert InsufficientPayment();

            accumulatedEthFees += fee;

            // Pay the seller
            (bool success, ) = payable(listing.seller).call{value: sellerProceeds}("");
            if (!success) revert WithdrawFailed();

            // Refund any overpayment
            uint256 refund = msg.value - listing.price;
            if (refund > 0) {
                (bool refundSuccess, ) = payable(msg.sender).call{value: refund}("");
                if (!refundSuccess) revert WithdrawFailed();
            }
        } else {
            accumulatedTokenFees += fee;

            // Pull tokens from buyer
            claudeToken.safeTransferFrom(msg.sender, address(this), listing.price);

            // Pay the seller
            claudeToken.safeTransfer(listing.seller, sellerProceeds);
        }

        // Transfer NFT from escrow to buyer
        IERC721(listing.nftContract).transferFrom(
            address(this),
            msg.sender,
            listing.tokenId
        );

        emit Sold(
            _listingId,
            msg.sender,
            listing.seller,
            listing.tokenId,
            listing.price,
            fee,
            listing.paymentType
        );
    }

    /**
     * @notice Cancel an active listing and return the NFT to the seller.
     * @param _listingId The ID of the listing to cancel.
     */
    function cancelListing(uint256 _listingId) external nonReentrant {
        Listing storage listing = listings[_listingId];
        if (!listing.active) revert ListingNotActive();
        if (msg.sender != listing.seller) revert NotSeller();

        listing.active = false;

        // Return NFT to seller
        IERC721(listing.nftContract).transferFrom(
            address(this),
            listing.seller,
            listing.tokenId
        );

        emit ListingCancelled(_listingId, msg.sender);
    }

    // -----------------------------------------------------------------------
    //  External — Admin
    // -----------------------------------------------------------------------

    /**
     * @notice Withdraw accumulated marketplace fees to the owner.
     */
    function withdrawFees() external onlyOwner nonReentrant {
        uint256 ethAmount = accumulatedEthFees;
        uint256 tokenAmount = accumulatedTokenFees;

        accumulatedEthFees = 0;
        accumulatedTokenFees = 0;

        if (ethAmount > 0) {
            (bool success, ) = payable(owner()).call{value: ethAmount}("");
            if (!success) revert WithdrawFailed();
        }

        if (tokenAmount > 0) {
            claudeToken.safeTransfer(owner(), tokenAmount);
        }

        emit FeesWithdrawn(owner(), ethAmount, tokenAmount);
    }

    // -----------------------------------------------------------------------
    //  External — Views
    // -----------------------------------------------------------------------

    /**
     * @notice Get the details of a listing.
     * @param _listingId The listing to query.
     * @return The Listing struct.
     */
    function getListing(
        uint256 _listingId
    ) external view returns (Listing memory) {
        return listings[_listingId];
    }

    /**
     * @notice Total number of listings ever created.
     */
    function totalListings() external view returns (uint256) {
        return _listingIds.current();
    }
}
