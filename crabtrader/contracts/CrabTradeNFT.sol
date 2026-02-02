// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract CrabTradeNFT is ERC721, Ownable {
    struct TradeRecord {
        string market;
        string position;
        uint256 entryPrice;
        uint256 exitPrice;
        int256 pnlBps;
        uint256 timestamp;
        string commentary;
    }

    uint256 private _nextTokenId = 1;
    mapping(uint256 => TradeRecord) public tradeRecords;

    event TradeMinted(uint256 indexed tokenId, string market, int256 pnlBps);

    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) Ownable(msg.sender) {}

    function mintTrade(
        address to,
        string calldata market,
        string calldata position,
        uint256 entryPrice,
        uint256 exitPrice,
        int256 pnlBps,
        uint256 timestamp,
        string calldata commentary
    ) external onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        tradeRecords[tokenId] = TradeRecord({
            market: market,
            position: position,
            entryPrice: entryPrice,
            exitPrice: exitPrice,
            pnlBps: pnlBps,
            timestamp: timestamp,
            commentary: commentary
        });

        _safeMint(to, tokenId);
        emit TradeMinted(tokenId, market, pnlBps);
        return tokenId;
    }

    function isNotableTrade(int256 pnlBps) public pure returns (bool) {
        return pnlBps > 2000 || pnlBps < -2000;
    }
}
