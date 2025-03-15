let connex = null;
let currentAccount = null;

async function initVeChain() {
    try {
        // Check for Connex from VeWorld/Sync2
        if (window.connex) {
            connex = window.connex;
            
            // Verify we can access the Thor API
            const thor = connex.thor;
            if (!thor) {
                throw new Error('Invalid Connex instance');
            }

            return true;
        }
        
        throw new Error('Please install VeWorld wallet from veworld.net and refresh the page');
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
                throw new Error('Failed to initialize VeChain wallet');
            }
        }

        // Get network info first
        const chainTag = connex.thor.genesis.id;
        const network = chainTag === '0x00000000851caf3cfdb6e899cf5958bfb1ac3413d346d43539627e6be7ec1b4a' ? 'MainNet' : 'TestNet';

        // Request wallet connection using Connex certification
        const certResponse = await connex.vendor
            .sign('cert', {
                purpose: 'identification',
                payload: {
                    type: 'text',
                    content: 'Connect to Incinerator'
                }
            })
            .request();

        if (!certResponse?.annex?.signer) {
            throw new Error('Invalid wallet response');
        }

        currentAccount = certResponse.annex.signer;
        return {
            success: true,
            address: currentAccount,
            network: network
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
        throw new Error('Wallet not connected');
    }

    try {
        // Get VET balance using thor.account
        const vetAccount = await connex.thor.account(currentAccount).get();
        if (!vetAccount) {
            throw new Error('Failed to fetch VET balance');
        }

        // Get VTHO balance using contract call
        const vthoContract = '0x0000000000000000000000000000456E65726779';
        const vthoABI = {
            "constant": true,
            "inputs": [{"name": "_owner", "type": "address"}],
            "name": "balanceOf",
            "outputs": [{"name": "balance", "type": "uint256"}],
            "type": "function"
        };

        const vthoMethod = connex.thor.account(vthoContract).method(vthoABI);
        const vthoBalance = await vthoMethod.call(currentAccount);

        if (!vthoBalance?.decoded?.[0]) {
            throw new Error('Failed to fetch VTHO balance');
        }

        return {
            vet: formatBalance(vetAccount.balance),
            vtho: formatBalance(vthoBalance.decoded[0])
        };
    } catch (error) {
        console.error('Balance fetch error:', error);
        throw error;
    }
}

function formatBalance(balance) {
    return (parseInt(balance) / 1e18).toFixed(2);
} 