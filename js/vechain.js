let connex = null;
let currentAccount = null;

// TestNet Genesis ID
const TESTNET_GENESIS = '0x00000000851caf3cfdb6e899cf5958bfb1ac3413d346d43539627e6be7ec1b4a';
const TESTNET_VTHO = '0x0000000000000000000000000000456E65726779';

async function waitForWallet(timeout = 5000) {
    const start = Date.now();
    
    while (Date.now() - start < timeout) {
        if (window.walletReady) {
            return true;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    return false;
}

async function initVeChain() {
    try {
        const hasWallet = await waitForWallet();
        if (!hasWallet) {
            console.log('VeWorld wallet not detected');
            return false;
        }

        // Get Connex instance
        connex = window.connex;
        
        // Verify TestNet connection
        const network = connex.thor.genesis.id;
        if (network !== TESTNET_GENESIS) {
            console.log('Please switch to TestNet in VeWorld');
            return false;
        }

        return true;
    } catch (error) {
        console.error('VeChain initialization error:', error);
        return false;
    }
}

async function connectVeChainWallet() {
    try {
        if (!connex) {
            const initialized = await initVeChain();
            if (!initialized) {
                throw new Error('Please connect to VeChain TestNet in VeWorld');
            }
        }

        // Get account via Connex certification
        const certResponse = await connex.vendor
            .sign('cert', {
                purpose: 'identification',
                payload: {
                    type: 'text',
                    content: 'Connect to Incinerator TestNet'
                }
            })
            .request();

        if (!certResponse?.annex?.signer) {
            throw new Error('Wallet connection failed');
        }

        currentAccount = certResponse.annex.signer;
        
        // Verify we can access the account
        const accountState = await connex.thor.account(currentAccount).get();
        if (!accountState) {
            throw new Error('Could not access wallet account');
        }

        return {
            success: true,
            address: currentAccount,
            network: 'TestNet'
        };
    } catch (error) {
        console.error('Wallet connection error:', error);
        return {
            success: false,
            error: error.message || 'Failed to connect wallet'
        };
    }
}

async function getBalances() {
    if (!currentAccount || !connex) {
        throw new Error('TestNet wallet not connected');
    }

    try {
        // Get TestNet VET balance
        const vetAccount = await connex.thor.account(currentAccount).get();
        if (!vetAccount) {
            throw new Error('Failed to fetch TestNet VET balance');
        }

        // Get TestNet VTHO balance using the energy contract
        const vthoMethod = connex.thor
            .account(TESTNET_VTHO)
            .method({
                "constant": true,
                "inputs": [{"name": "_owner", "type": "address"}],
                "name": "balanceOf",
                "outputs": [{"name": "balance", "type": "uint256"}],
                "type": "function"
            });

        const vthoBalance = await vthoMethod.call(currentAccount);
        console.log('Raw balances:', {
            vet: vetAccount.balance,
            vtho: vthoBalance?.decoded?.[0]
        });

        // Format and return balances
        const formattedVET = formatBalance(vetAccount.balance);
        const formattedVTHO = formatBalance(vthoBalance?.decoded?.[0] || '0');

        console.log('Formatted balances:', {
            vet: formattedVET,
            vtho: formattedVTHO
        });

        return {
            vet: formattedVET,
            vtho: formattedVTHO
        };
    } catch (error) {
        console.error('TestNet balance fetch error:', error);
        throw error;
    }
}

function formatBalance(balance) {
    try {
        const wei = BigInt(balance);
        const formatted = Number(wei) / 1e18;
        return formatted.toFixed(2);
    } catch (error) {
        console.error('Balance format error:', error);
        return '0.00';
    }
} 