// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {console} from "forge-std/console.sol";
import {IERC20, SafeERC20} from "lib/openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {MerkleProof} from "lib/openzeppelin-contracts/contracts/utils/cryptography/MerkleProof.sol";
import {EIP712} from "lib/openzeppelin-contracts/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "lib/openzeppelin-contracts/contracts/utils/cryptography/ECDSA.sol";

contract MerkleAirdrop is EIP712 {

    using SafeERC20 for IERC20;

    error MerkleAirdrop__InvalidProof();
    error MerkleAirdrop__AlreadyClaimed();
    error MerkleAirdrop__InvalidSignature();

    struct AirdropClaim {
        address account;
        uint256 amount;
    }

    bytes32 private constant MESSAGE_TYPEHASH = keccak256(
        "AirdropClaim(address account,uint256 amount)"
    );

    event Claim(address indexed account, uint256 amount);

    // some list of addresses
    // Allow someone in the list to claim ERC-20 tokens
    address[] claimers;
    bytes32 private immutable i_merkleRoot;
    IERC20 private immutable i_airdropToken;
    mapping(address claimer => bool claimed) private s_hasClaimed;

    constructor(bytes32 merkleRoot, IERC20 airdropToken) EIP712("MerkleAirdrop", "1") {
        i_merkleRoot = merkleRoot;
        i_airdropToken = airdropToken;

    }

    function claim(address account, uint256 amount, bytes32[] calldata merkleProof, uint8 v, bytes32 r, bytes32 s) external {
        if(s_hasClaimed[account]){
            revert MerkleAirdrop__AlreadyClaimed();
        }
        // check the signature
        if(!_isValidSignature(account, getMessageHash(account, amount), v, r, s)) {
            revert MerkleAirdrop__InvalidSignature();
        }
        // calculate using the account and the amount, the hash -> leaf node
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(account, amount))));
        if(!MerkleProof.verify(merkleProof, i_merkleRoot, leaf)) {
            revert MerkleAirdrop__InvalidProof();
        }
        // Prevent re-entry attacks
        s_hasClaimed[account] = true;
        emit Claim(account, amount);
        i_airdropToken.safeTransfer(account, amount);
    }

    function getMessageHash(address account, uint256 amount) public view returns(bytes32) {
        return _hashTypedDataV4(
            keccak256(abi.encode(MESSAGE_TYPEHASH, AirdropClaim({account : account, amount : amount})))
        );
    }

    function _isValidSignature(address account, bytes32 digest, uint8 v, bytes32 r, bytes32 s) internal pure returns(bool) {
        (address actualSigner, , ) = ECDSA.tryRecover(digest, v, r, s);
        return actualSigner == account;
    }

    function getMerkleRoot() external view returns(bytes32) {
        return i_merkleRoot;
    }

    function getAirdropToken() external view returns(IERC20) {
        return i_airdropToken;
    }

}
