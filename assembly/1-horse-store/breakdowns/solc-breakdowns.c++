// Contract Creation Code
// 0x6080604052348015600e575f80fd5b5060a58061001b5f395ff3

// Runtime Code
// fe6080604052348015600e575f80fd5b50600436106030575f3560e01c8063cdfead2e146034578063e026c017146045575b5f80fd5b6043603f3660046059565b5f55565b005b5f5460405190815260200160405180910390f35b5f602082840312156068575f80fd5b503591905056

// Metadata
//fea2646970667358221220ab14fc6a0a65cd2981a126429102534cc48b73110d30cbd720cae67cfe301ae164736f6c63430008180033

// 1. Contract Creation Code
// Free Memory Pointer
PUSH1 0x80           // [0x80]
PUSH1 0x40           // [0x80, 0x40]
MSTORE               // [0x80, 0x40] Store the free memory pointer at 0x80

// What's this chunk do?
// If someone sent value with this call revert
// Otherwise, jump, to continue execution
CALLVALUE            // [msg.value]
DUP1                 // [msg.value, msg.value]
ISZERO               // [msg.value == 0, msg.value]
PUSH1 0x0e           // [0x0E, msg.value == 0, msg.value]
JUMPI                // [msg.value]
PUSH0                // [0x00, msg.value]
DUP1                 // [0x00, 0x00, msg.value]
REVERT               // [msg.value]

// Jump dest if msg.value == 0
// Sticks the runtime code on chain
JUMPDEST             // [msg.value]
POP                  // []
PUSH1 0xa5           // [0xa5]
DUP1                 // [0xa5, 0xa5]
PUSH2 0x001b         // [0x001b, 0xa5, 0xa5]
PUSH0                // [0x00, 0x001b, 0xa5, 0xa5]
CODECOPY             // [0xa5]                Memory:[runtime code]
PUSH0                // [0x00, 0xa5]
RETURN               // []
INVALID              // []

// 2. Runtime Code
// Entry point of all calls
// Free Memory Pointer
PUSH1 0x80           // [0x80]
PUSH1 0x40           // [0x40, 0x80]
MSTORE               // [0x40:0x80] // the value is 0x80 in the memory index 0x40

// Checking for msg.value, and if given, reverting
CALLVALUE            // [msg.value]
DUP1                 // [msg.value, msg.value]
ISZERO               // [msg.value == 0, msg.value]
PUSH1 0x0e           // [0x0E, msg.value == 0, msg.value]
JUMPI                // [msg.value]
PUSH0                // [0x00, msg.value]
DUP1                 // [0x00, 0x00, msg.value]
REVERT               // [msg.value]

// If msg.value == 0, start here
// This is checking to see if there is enough calldata for a function selector
JUMPDEST             // [msg.value]
POP                  // []
PUSH1 0x04           // [0x04]
CALLDATASIZE         // [calldata_size, 0x04]
LT                   // [calldata_size < 0x04]
PUSH1 0x30           // [0x30, calldata_size < 0x04]
JUMPI                // []
// If calldata_size < 0x04 -> calldata_jump 

// Function dispatching in solidity
PUSH0                // [0x00]
CALLDATALOAD         // [32bytes of calldata]
PUSH1 0xe0           // [0xe0, 32bytes of calldata]
SHR                  // [calldata[0:4]] // function selector

// Dispatching for setNumberOfHorses
DUP1                 // [function selector, function selector]
PUSH4 0xcdfead2e     // [0xcdfead2e, function selector, function selector]
EQ                   // [function selector == 0xcdfead2e, function selector]
PUSH1 0x34           // [0x34, function selector == 0xcdfead2e, function selector]
JUMPI                // [function selector]
// if function selector == 0xcdfead2e, set_number_of_horses

// Dispatching for readNumberOfHorses
DUP1                 // [function selector, function selector]
PUSH4 0xe026c017     // [0xe026c017, function selector, function selector]
EQ                   // [function selector == 0xe026c017, function selector]
PUSH1 0x45           // [0x45, function selector == 0xe026c017, function selector]
JUMPI                // [function selector]
// if function selector == 0xe026c017, read_number_of_horses

// calldata_jump
// Revert JumpDest
JUMPDEST             // []
PUSH0                // [0x00]
DUP1                 // [0x00, 0x00]
REVERT               // []

// updateNumberOfHorses jump dest 1
// Setup jumping program counters in the stack
JUMPDEST             // [function_selector]
PUSH1 0x43           // [0x43, function_selector]
PUSH1 0x3f           // [0x3f, 0x43, function_selector]
CALLDATASIZE         // [calldata_size, 0x3f, 0x43, function_selector]
PUSH1 0x04           // [0x04, calldata_size, 0x3f, 0x43, function_selector]
PUSH1 0x59           // [0x59, 0x04, calldata_size, 0x3f, 0x43, function_selector]
JUMP                 // [0x04, calldata_size, 0x3f, 0x43, function_selector]

// updateNumberOfHorses jump dest 4
// We can finally run a sstore to save our value to storage: 
// 1. Function dispatch
// 2. Checked for msg.value
// 3. Checked that calldata is long enough
// 4. Received the number to use from the calldata
JUMPDEST             // [[calldata_of_numberToUpdateHorses], 0x43, function_selector]
PUSH0                // [0x00, [calldata_of_numberToUpdateHorses], 0x43, function_selector]
SSTORE               // [0x43, function_selector]
JUMP                 // [function_selector]
// Jump to dest 5

// Jump dest 5
JUMPDEST             // [function_selector]
STOP                 // []

// readNumberOfHorses jump dest 1
// The only jump dest
JUMPDEST             // [function_selector]
PUSH0                // [0x00, function_selector]
SLOAD                // [numOfHorses, function_selector]
PUSH1 0x40           // [0x40, numOfHorses, function_selector]
MLOAD                // [0x80, numOfHorses, function_selector] Memory [0x40:0x80]
SWAP1                // [numOfHorses, 0x80, function_selector]
DUP2                 // [0x80, numOfHorses, 0x80, function_selector]
MSTORE               // [0x80, function_selector] Memory [0x80, numOfHorses]
PUSH1 0x20           // [0x20, 0x80, function_selector]
ADD                  // [0xa0, function_selector]
PUSH1 0x40           // [0x40, 0xa0, function_selector]
MLOAD                // [0x80, 0xa0, function_selector] 
DUP1                 // [0x80, 0x80, 0xa0, function_selector] 
SWAP2                // [0xa0, 0x80, 0x80, function_selector]
SUB                  // [0xa0 - 0x80, 0x80, function_selector]
SWAP1                // [0x80, 0xa0 - 0x80, function_selector]
// Return a value of size 32 bytes, that's located at position 0x80 in memory
RETURN               // [function_selector]

// UpdateNumberOfHorses jump dest 2
// Check to see if there is a value to update the number of horses
// 4 bytes for the function selector, 32 bytes for calldata
JUMPDEST             // [0x04, calldata_size, 0x3f, 0x43, function_selector]       
PUSH0                // [0x00, 0x04, calldata_size, 0x3f, 0x43, function_selector]
PUSH1 0x20           // [0x20, 0x00, 0x04, calldata_size, 0x3f, 0x43, function_selector]
DUP3                 // [0x04, 0x20, 0x00, 0x04, calldata_size, 0x3f, 0x43, function_selector]
DUP5                 // [calldata_size, 0x04, 0x20, 0x00, 0x04, calldata_size, 0x3f, 0x43, function_selector]
SUB                  // [calldata_size - 0x04, 0x20, 0x00, 0x04, calldata_size, 0x3f, 0x43, function_selector]
// Is there more calldata than just the function selector?
SLT                  // [calldata_size - 0x04 < 0x20, 0x00, 0x04, calldata_size, 0x3f, 0x43, function_selector]
ISZERO               // [more_data_than_selector?, 0x00, 0x04, calldata_size, 0x3f, 0x43, function_selector]
PUSH1 0x68           // [0x68, more_data_than_selector?, 0x00, 0x04, calldata_size, 0x3f, 0x43, function_selector]
JUMPI                // [0x00, 0x04, calldata_size, 0x3f, 0x43, function_selector]
// We are going to jump to jump dest 3 if there is more calldata than:
// function selector + 0x20

// Revert if there isn't enough calldata
PUSH0                // [0x00, 0x00, 0x04, calldata_size, 0x3f, 0x43, function_selector]
DUP1                 // [0x00, 0x00, 0x00, 0x04, calldata_size, 0x3f, 0x43, function_selector]
REVERT               // [0x00, 0x04, calldata_size, 0x3f, 0x43, function_selector]

// updateNumberOfHorses jump dest 3
// Grab the calldata for updating the horse number
// Delete some stuff in the stack
JUMPDEST             // [0x00, 0x04, calldata_size, 0x3f, 0x43, function_selector]
POP                  // [0x04, calldata_size, 0x3f, 0x43, function_selector]
CALLDATALOAD         // [[calldata_of_numberToUpdateHorses], calldata_size, 0x3f, 0x43, function_selector]
SWAP2                // [0x3f, calldata_size, [calldata_of_numberToUpdateHorses], 0x43, function_selector]
SWAP1                // [calldata_size, 0x3f, [calldata_of_numberToUpdateHorses], 0x43, function_selector]
POP                  // [0x3f, [calldata_of_numberToUpdateHorses], 0x43, function_selector]
JUMP                 // [[calldata_of_numberToUpdateHorses], 0x43, function_selector]

// 3. Metadata
INVALID
LOG2
PUSH5 0x6970667358
INVALID
SLT
KECCAK256
INVALID
EQ
INVALID
PUSH11 0x0a65cd2981a12642910253
INVALID
INVALID
DUP12
PUSH20 0x110d30cbd720cae67cfe301ae164736f6c634300
ADDMOD
XOR
STOP
CALLER