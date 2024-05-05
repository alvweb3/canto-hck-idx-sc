# IDX Protocol Smart Contracts

To test the code in this repository locally, run the following commands:
```shell
yarn install

npx hardhat node --hostname 127.0.0.1

npx hardhat run utils/deploy.ts --network localhost
```

Finally, create a .env file with the following values:
```shell
INFURA_TOKEN=0
ALCHEMY_TOKEN=0
```