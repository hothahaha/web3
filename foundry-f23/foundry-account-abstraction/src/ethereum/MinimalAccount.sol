// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IAccount} from "lib/account-abstraction/contracts/interfaces/IAccount.sol";
import {PackedUserOperation} from "lib/account-abstraction/contracts/interfaces/PackedUserOperation.sol";
import {Ownable} from "lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import {MessageHashUtils} from "lib/openzeppelin-contracts/contracts/utils/cryptography/MessageHashUtils.sol";
import {ECDSA} from "lib/openzeppelin-contracts/contracts/utils/cryptography/ECDSA.sol";
import {SIG_VALIDATION_FAILED, SIG_VALIDATION_SUCCESS} from "lib/account-abstraction/contracts/core/Helpers.sol";
import {IEntryPoint} from "lib/account-abstraction/contracts/interfaces/IEntrypoint.sol";

contract MinimalAccount is IAccount, Ownable {
    /*////////////////////////////////////////////////////////////////////////
                                   ERRORS
    ////////////////////////////////////////////////////////////////////////*/
    error MinimalAccount__NotFromEntryPoint();
    error MinimalAccount__NotFromEntryPointOrOwner();
    error MinimalAccount__CallFailed(bytes);

    /*////////////////////////////////////////////////////////////////////////
                               STATE VARIABLES
    ////////////////////////////////////////////////////////////////////////*/
    IEntryPoint private immutable i_entryPoint;

    /*////////////////////////////////////////////////////////////////////////
                                 MODIFIERS
    ////////////////////////////////////////////////////////////////////////*/
    modifier requireFromEntryPoint() {
        if (msg.sender != address(i_entryPoint)) {
            revert MinimalAccount__NotFromEntryPoint();
        }
        _;
    }

    modifier requireFromEntryPointOrOwner() {
        if (msg.sender != address(i_entryPoint) && msg.sender != owner()) {
            revert MinimalAccount__NotFromEntryPointOrOwner();
        }
        _;
    }

    /*////////////////////////////////////////////////////////////////////////
                                 FUNCTIONS
    ////////////////////////////////////////////////////////////////////////*/
    constructor(address entryPoint) Ownable(msg.sender) {
        i_entryPoint = IEntryPoint(entryPoint);
    }

    receive() external payable {}

    /*////////////////////////////////////////////////////////////////////////
                              EXTERNAL FUNCTIONS
    ////////////////////////////////////////////////////////////////////////*/
    /*
     * @dev 执行带数据的转账操作.
     * @param dest 目标地址.
     * @param value 金额.
     * @param functionData 数据.
     */
    function execute(
        address dest,
        uint256 value,
        bytes calldata functionData
    ) external requireFromEntryPointOrOwner {
        (bool success, bytes memory result) = dest.call{value: value}(
            functionData
        );
        if (!success) {
            revert MinimalAccount__CallFailed(result);
        }
    }

    /*
     * @dev 验证用户操作（签名验证
     * @param userOp 用户操作结构体
     * @param userOpHash 用户操作的Hash
     * @param missingAccountFunds 账户缺少的资金
     * @return validationData 返回验证结果
     */
    function validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external requireFromEntryPoint returns (uint256 validationData) {
        validationData = _validateSignature(userOp, userOpHash);
        _payPrefund(missingAccountFunds);
    }

    /*////////////////////////////////////////////////////////////////////////
                              INTERNAL FUNCTIONS
    ////////////////////////////////////////////////////////////////////////*/
    /*
     * @dev 验证签名.
     * @param userOp 用户操作结构体
     * @param userOpHash 用户操作的Hash
     * @return validationData 返回验证结果
     */
    function _validateSignature(
        PackedUserOperation memory userOp,
        bytes32 userOpHash
    ) internal view returns (uint256 validationData) {
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(
            userOpHash
        );
        address signer = ECDSA.recover(ethSignedMessageHash, userOp.signature);
        if (signer != owner()) {
            return SIG_VALIDATION_FAILED;
        }
        return SIG_VALIDATION_SUCCESS;
    }

    /*
     * @dev 支付预充值.
     * @param missingAccountFunds 账户缺少的资金
     */
    function _payPrefund(uint256 missingAccountFunds) internal {
        if (missingAccountFunds != 0) {
            (bool success, ) = payable(msg.sender).call{
                value: missingAccountFunds,
                gas: type(uint256).max
            }("");
            (success);
        }
    }

    /*////////////////////////////////////////////////////////////////////////
                                   GETTERS
    ////////////////////////////////////////////////////////////////////////*/
    function getEntrypoint() external view returns (address) {
        return address(i_entryPoint);
    }
}
