// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockNFT is ERC721, Ownable {

    constructor() ERC721("mockNFT", "MNFT") {}
    function safeMint(address to, uint256 tokenId) public {
        _safeMint(to, tokenId);
    }

}
