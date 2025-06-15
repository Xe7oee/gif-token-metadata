require('dotenv').config();
const bs58 = require('bs58');
const { 
    Connection, 
    PublicKey, 
    Keypair,
    clusterApiUrl,
    Transaction,
    SystemProgram,
    LAMPORTS_PER_SOL
} = require('@solana/web3.js');
const { 
    createMint,
    getOrCreateAssociatedTokenAccount,
    mintTo,
    TOKEN_PROGRAM_ID,
    MINT_SIZE,
    getMinimumBalanceForRentExemptMint,
    createInitializeMintInstruction
} = require('@solana/spl-token');
const { 
    PROGRAM_ID: TOKEN_METADATA_PROGRAM_ID,
    createCreateMetadataAccountV3Instruction,
} = require('@metaplex-foundation/mpl-token-metadata');

// Connect to devnet
const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

async function createToken() {
    try {
        // Load payer keypair from environment variable
        if (!process.env.PAYER_PRIVATE_KEY) {
            console.error('Error: PAYER_PRIVATE_KEY not found in .env file. Please set it up.');
            return;
        }
        const payerPrivateKeyBytes = JSON.parse(process.env.PAYER_PRIVATE_KEY);
        const payerKeypair = Keypair.fromSecretKey(new Uint8Array(payerPrivateKeyBytes));
        console.log('Using Payer address:', payerKeypair.publicKey.toString());
        console.log('Please ensure the Payer address has at least 1 SOL for fees and rent exemption.');

        let mintKeypair;
        if (process.env.MINT_PRIVATE_KEY_BASE58) {
            // Load mint keypair from Base58 environment variable
            const privateKeyBytes = bs58.decode(process.env.MINT_PRIVATE_KEY_BASE58);
            mintKeypair = Keypair.fromSecretKey(privateKeyBytes);
            console.log('Loaded Mint keypair from MINT_PRIVATE_KEY_BASE58.');
        } else {
            // Create a new keypair for the token mint (always unique)
            mintKeypair = Keypair.generate();
            console.log('Generated new Mint keypair.');
        }
        
        console.log('Mint address:', mintKeypair.publicKey.toString());
        console.log('Mint Private Key (Base58, save this!): ', bs58.encode(mintKeypair.secretKey));

        // Get the minimum lamports required for rent exemption
        const lamports = await getMinimumBalanceForRentExemptMint(connection);

        // Create the mint account
        const createMintAccountIx = SystemProgram.createAccount({
            fromPubkey: payerKeypair.publicKey, // Payer pays for the new mint account
            newAccountPubkey: mintKeypair.publicKey,
            space: MINT_SIZE,
            lamports,
            programId: TOKEN_PROGRAM_ID,
        });

        // Initialize the mint
        const initMintIx = createInitializeMintInstruction(
            mintKeypair.publicKey,
            9, // 9 decimals
            mintKeypair.publicKey, // mint authority (this will be the new mint keypair)
            mintKeypair.publicKey, // freeze authority (optional)
            TOKEN_PROGRAM_ID
        );

        // Create metadata for the token
        const metadataAddress = PublicKey.findProgramAddressSync(
            [
                Buffer.from('metadata'),
                TOKEN_METADATA_PROGRAM_ID.toBuffer(),
                mintKeypair.publicKey.toBuffer(),
            ],
            TOKEN_METADATA_PROGRAM_ID
        )[0];

        // Create metadata instruction
        const createMetadataIx = createCreateMetadataAccountV3Instruction(
            {
                metadata: metadataAddress,
                mint: mintKeypair.publicKey,
                mintAuthority: mintKeypair.publicKey,
                payer: payerKeypair.publicKey, // Payer signs for metadata creation
                updateAuthority: payerKeypair.publicKey, // Changed to payerKeypair for better control/compatibility
            },
            {
                createMetadataAccountArgsV3: {
                    data: {
                        name: "GIF Token",
                        symbol: "GIF",
                        uri: "https://raw.githubusercontent.com/Xe7oee/gif-token-metadata/main/metadata.json", // Now points to your hosted metadata!
                        sellerFeeBasisPoints: 0,
                        creators: [
                            {
                                address: payerKeypair.publicKey,
                                share: 100,
                            },
                        ],
                        collection: null,
                        uses: null,
                    },
                    isMutable: true,
                    collectionDetails: null,
                },
            }
        );

        // Create transaction
        const transaction = new Transaction().add(
            createMintAccountIx,
            initMintIx,
            createMetadataIx
        );

        // Get the latest blockhash
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = payerKeypair.publicKey; // Payer covers the transaction fees

        // Sign the transaction with both the payer and the new mint keypair
        transaction.sign(payerKeypair, mintKeypair);

        // Send the transaction
        const signature = await connection.sendRawTransaction(transaction.serialize());
        console.log('Transaction signature:', signature);

        // Wait for confirmation
        await connection.confirmTransaction(signature);
        console.log('Token created successfully!');
        console.log('Mint address:', mintKeypair.publicKey.toString());
        console.log('Metadata address:', metadataAddress.toString());
        console.log('Mint Private Key (Base58, save this!): ', bs58.encode(mintKeypair.secretKey));

    } catch (error) {
        console.error('Error creating token:', error);
    }
}

createToken(); 