# Solana Token Creator

This project helps you create a new token on Solana's devnet.

## Prerequisites

1. Node.js installed on your system
2. Solflare wallet with devnet SOL
3. Basic understanding of Solana development

## Setup

1. Install dependencies:
```bash
npm install
```

2. Make sure you have SOL in your Solflare wallet on devnet. You can get devnet SOL from the Solana faucet:
   - Visit https://solfaucet.com/
   - Connect your Solflare wallet
   - Request devnet SOL

## Creating Your Token

1. Run the script:
```bash
npm start
```

2. The script will:
   - Generate a new mint account
   - Initialize the token with 9 decimals
   - Print the mint address and private key

3. Save the mint address and private key securely - you'll need them for future operations.

## Important Notes

- The token is created on devnet, not mainnet
- The mint authority and freeze authority are set to the mint account itself
- The token has 9 decimals (standard for Solana tokens)
- Make sure to save the private key bytes that are printed - you'll need them to mint more tokens later

## Next Steps

After creating your token, you can:
1. Create token accounts for users
2. Mint tokens to those accounts
3. Transfer tokens between accounts
4. Burn tokens

Would you like to proceed with any of these next steps? 