let connex = null;
let currentAccount = null;

async function checkWallet() {
    return new Promise((resolve) => {
        // First check if already available
        if (typeof window.vechain !== 'undefined') {
            resolve(true);
            return;
        }

        // Listen for vechain injection
        window.addEventListener('vechainConnect', () => {
            resolve(true);
        }, { once: true });

        // Timeout after 3 seconds
        setTimeout(() => {
            resolve(false);
        }, 3000);
    });
}

async function initVeChain() {
    try {
        const walletAvailable = await checkWallet();
        
        if (!walletAvailable) {
            console.log('VeWorld wallet not found');
            return false;
        }

        // Try to enable the wallet
        if (typeof window.vechain !== 'undefined') {
            try {
                const accounts = await window.vechain.request({
                    method: 'eth_requestAccounts'
                });
                
                if (accounts && accounts.length > 0) {
                    console.log('VeWorld wallet enabled');
                    connex = window.connex;
                    return true;
                }
            } catch (error) {
                console.log('Failed to enable wallet:', error);
                return false;
            }
        }

        return false;
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
                throw new Error('Please install VeWorld wallet from veworld.net');
            }
        }

        // Get network info
        const chainTag = connex.thor.genesis.id;
        const network = chainTag === '0x00000000851caf3cfdb6e899cf5958bfb1ac3413d346d43539627e6be7ec1b4a' ? 'MainNet' : 'TestNet';

        try {
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
                throw new Error('Wallet connection failed');
            }

            currentAccount = certResponse.annex.signer;
            return {
                success: true,
                address: currentAccount,
                network: network
            };
        } catch (certError) {
            throw new Error('Please unlock your VeWorld wallet and try again');
        }
    } catch (error) {
        console.error('Wallet connection error:', error);
        return {
            success: false,
            error: error.message
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