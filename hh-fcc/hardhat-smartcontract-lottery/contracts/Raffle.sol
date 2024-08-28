// Raffle

// Enter the lottery (paying some amount)
// Pick a random winner (verifiably random)
// Winner to be selected every X minutes -> complete automated
// Chainlink Oracle -> Randomness, Automated Execution (Chainlink Keepers)

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {VRFConsumerBaseV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {AutomationCompatibleInterface} from "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";
import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";
import {VRFCoordinatorV2_5Mock} from "@chainlink/contracts/src/v0.8/vrf/mocks/VRFCoordinatorV2_5Mock.sol";


    error Raffle__NotEnoughETHEntered();
error Raffle__TransactionFailed();
error Raffle__NotOpen();
error Raffle_UpkeepNotNeeded(uint256 balance, uint256 numPlayers, uint256 raffleState);

/**
 * @title A sample Raffle Contract
 * @author Galahad
 * @notice This contract is creating an untamable decentralized smart contract
 * @dev This implements Chainlink VRF V2 and Chainlink Keepers
 */
contract Raffle is VRFConsumerBaseV2Plus, AutomationCompatibleInterface {
    /* Type declarations */
    enum RaffleState {
        OPEN,
        CALCULATING
    } // uint256 0 = OPEN, 1 = CALCULATING

    /* State Variables */
    uint256 private immutable i_entranceFree; // Minimum amount to enter the raffle
    address payable[] private s_players;
    VRFCoordinatorV2_5Mock private immutable i_vrfCoordinator;
    bytes32 private immutable i_keyHash;
    uint256 private immutable i_subscriptionId;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private immutable i_callbackGasLimit;
    uint32 private constant NUM_WORDS = 1;

    /* Lottery Variables */
    address payable private s_winner;
    RaffleState private s_raffleState;
    uint256 private s_lastTimeStamp;
    uint256 private immutable i_interval;

    /* Events */
    event RaffleEnter(address indexed player);
    event RequestRaffleWinner(uint256 indexed requestId);
    event WinnerPicked(address indexed winner);

    /* Functions */
    constructor(
        address vrfCoordinatorV2,
        uint256 entranceFree,
        bytes32 keyHash,
        uint256 subscriptionId,
        uint32 callbackGasLimit,
        uint256 interval
    ) VRFConsumerBaseV2Plus(vrfCoordinatorV2) {
        i_entranceFree = entranceFree;
        i_vrfCoordinator = VRFCoordinatorV2_5Mock(vrfCoordinatorV2);
        i_keyHash = keyHash;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
        s_raffleState = RaffleState.OPEN;
        s_lastTimeStamp = block.timestamp;
        i_interval = interval;
    }

    /**
     * @notice Enter the raffle by sending some amount of ETH to the contract
     */
    function enterRaffle() public payable {
        if (msg.value < i_entranceFree) {
            revert Raffle__NotEnoughETHEntered();
        }
        if (s_raffleState != RaffleState.OPEN) {
            revert Raffle__NotOpen();
        }
        s_players.push(payable(msg.sender));
        // Emit an event when we update a dynamic array or mapping
        // Named events this the function name reversed
        emit RaffleEnter(msg.sender);
    }

    /**
     * @dev This is the function that the Chainlink Keepers needs call
     * they look for the 'upkeepNeeded' to return true
     * The following should be true in order to return true:
     * 1. Our time interval should have passed (every X minutes)
     * 2. The lottery should have at least 1 player, and have some ETH
     * 3. Our subscription is funded with Link
     * 4. The lottery should be in an active state (not paused)
     */
    function checkUpkeep (
        bytes memory /* checkData */
    )
        public
        override
        view
        returns  (
            bool upkeepNeeded,
            bytes memory /* performData */
        )
    {
        bool isOpen = (RaffleState.OPEN == s_raffleState);
        bool timePassed = ((block.timestamp - s_lastTimeStamp) > i_interval);
        bool hasPlayers = (s_players.length > 0);
        bool hasBalance = address(this).balance > 0;
        upkeepNeeded = (isOpen && timePassed && hasPlayers && hasBalance);
        return (upkeepNeeded, "");
    }

    /**
     * @dev This function is called by the Chainlink Keepers to execute the upkeep
     * It will calculate the winner of the raffle
     */
    function performUpkeep(
        bytes calldata /* performData */
    ) external override {
        (bool upkeepNeeded, ) = checkUpkeep("");
        if(!upkeepNeeded) {
            revert Raffle_UpkeepNotNeeded(
                address(this).balance,
                s_players.length,
                uint256(s_raffleState)
            );
        }
        s_raffleState = RaffleState.CALCULATING;
        uint256 requestId = i_vrfCoordinator.requestRandomWords(
//            i_keyHash, // gasLane
//            i_subscriptionId,
//            REQUEST_CONFIRMATIONS,
//            i_callbackGasLimit,
//            NUM_WORDS
        VRFV2PlusClient.RandomWordsRequest({
            keyHash: i_keyHash,
            subId: i_subscriptionId,
            requestConfirmations: REQUEST_CONFIRMATIONS,
            callbackGasLimit: i_callbackGasLimit,
            numWords: NUM_WORDS,
            extraArgs: VRFV2PlusClient._argsToBytes(
                VRFV2PlusClient.ExtraArgsV1({nativePayment: false})
            )
        })
        );
        emit RequestRaffleWinner(requestId);
    }

    /**
     * @dev This function is called by the Chainlink VRF Coordinator when the randomness is ready
     * It will pick a random winner from the players array and transfer the balance to the winner
     */
    function fulfillRandomWords(
        uint256 /* requestId */,
        uint256[] calldata randomWords
    ) internal override {
        uint256 indexOfWinner = randomWords[0] % s_players.length;
        address payable winner = s_players[indexOfWinner];
        s_winner = winner;
        // change the state of the raffle
        s_raffleState = RaffleState.OPEN;
        // reset the players array
        s_players = new address payable[](0);
        // reset the last timestamp
        s_lastTimeStamp = block.timestamp;
        (bool success, ) = winner.call{value: address(this).balance}("");
        if (!success) {
            revert Raffle__TransactionFailed();
        }
        emit WinnerPicked(winner);
        //        winner.transfer(address(this).balance);
    }

    /* Views / Prue functions */

    function getEntranceFee() public view returns (uint256) {
        return i_entranceFree;
    }

    function getPlayer(uint256 index) public view returns (address) {
        return s_players[index];
    }

    function getWinner() public view returns (address) {
        return s_winner;
    }

    function getRaffleState() public view returns (RaffleState) {
        return s_raffleState;
    }

    function getNumWords() public pure returns (uint256) {
        return NUM_WORDS;
    }

    function getNumberOfPlayers() public view returns (uint256) {
        return s_players.length;
    }

    function getLatestTimeStamp() public view returns (uint256) {
        return s_lastTimeStamp;
    }

    function getRequestConfirmations() public pure returns (uint16) {
        return REQUEST_CONFIRMATIONS;
    }

    function getInterval() public view returns (uint256) {
        return i_interval;
    }
}
