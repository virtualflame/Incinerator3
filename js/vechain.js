let connex = null;
let currentAccount = null;

async function initVeChain() {
    try {
        connex = new Connex({
            node: 'https://mainnet.veblocks.net/',
            network: 'main'
        });
        return true;
    } catch (error) {
        console.error('VeChain initialization error:', error);
        return false;
    }
}

async function connectVeChainWallet() {
    try {
        if (!connex) {
            await initVeChain();
        }

        const certificateResponse = await connex.vendor.sign('cert', {
            purpose: 'identification',
            payload: {
                type: 'text',
                content: 'Connect to Incinerator'
            }
        });

        currentAccount = certificateResponse.annex.signer;
        return {
            success: true,
            address: currentAccount
        };
    } catch (error) {
        console.error('Wallet connection error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

async function getBalances() {
    if (!currentAccount) {
        throw new Error('No wallet connected');
    }

    try {
        const vetBalance = await connex.thor.account(currentAccount).get();
        if (!vetBalance) {
            throw new Error('Failed to fetch VET balance');
        }
        
        const vthoContract = '0x0000000000000000000000000000456E65726779';
        const vthoABI = {
            "constant": true,
            "inputs": [{"name": "_owner","type": "address"}],
            "name": "balanceOf",
            "outputs": [{"name": "balance","type": "uint256"}],
            "type": "function"
        };
        
        const vthoMethod = connex.thor.account(vthoContract).method(vthoABI);
        const vthoBalance = await vthoMethod.call(currentAccount);
        
        if (!vthoBalance || !vthoBalance.decoded) {
            throw new Error('Failed to fetch VTHO balance');
        }

        return {
            vet: formatBalance(vetBalance.balance),
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