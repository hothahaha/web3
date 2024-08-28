// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// forge install OpenZeppelin/openzeppelin-contracts --no-commit
import "lib/openzeppelin-contracts/contracts/token/ERC721/ERC721.sol";

contract BasicNft is ERC721 {
    uint256 public s_tokenCounter;
    mapping(uint256 => string) private s_tokenIdToUri;

    constructor() ERC721("Dogie", "DOG") {
        s_tokenCounter = 0;
    }

    function mintNft(string memory tokenUri) public {
        s_tokenIdToUri[s_tokenCounter] = tokenUri;
        _safeMint(msg.sender, s_tokenCounter);
        s_tokenCounter++;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        return s_tokenIdToUri[tokenId];
    }
}
