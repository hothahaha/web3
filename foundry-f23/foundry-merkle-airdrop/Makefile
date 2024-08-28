-include .env

.PHONY: all test deploy

DEFAULT_ANVIL_KEY := 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

build :; forge build

test :; forge test

anvil :; anvil -m 'test test test test test test test test test test test junk' --steps-tracing --block-time 1

install :;  forge install Cyfrin/foundry-devops --no-commit && forge install OpenZeppelin/openzeppelin-contracts --no-commit && forge install dmfxyz/murky --no-commit

NETWORK_ARGS := --rpc-url http://localhost:8545 --private-key $(DEFAULT_ANVIL_KEY) --broadcast

deploy:
	@forge script script/DeployMerkleAirdrop.sol:DeployMerkleAirdrop $(NETWORK_ARGS)
