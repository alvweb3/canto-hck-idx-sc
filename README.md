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

You can find our other two repositories (with the front end code for the landing page and the app) at:
1. https://github.com/alvweb3/idx_hackathon_lp
2. https://github.com/alvweb3/idx_hackathon_app

You can find the deployed websites at:
1. https://idx-hackathon-lp.vercel.app/
2. https://idx-hackathon-gw4q2b149-alvs-projects-d7e33084.vercel.app/