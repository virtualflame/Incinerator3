let connex = null;
let currentAccount = null;

async function connectWallet() {
    const statusBox = document.getElementById('wallet-status');
    const balanceContainer = document.getElementById('balance-container');

    try {
        // Initialize Connex
        connex = new Connex({
            node: 'https://mainnet.veblocks.net/',
            network: 'main'
        });

        // Request wallet connection
        const certificateResponse = await connex.vendor.sign('cert', {
            purpose: 'identification',
            payload: {
                type: 'text',
                content: 'Connect to Incinerator'
            }
        });

        currentAccount = certificateResponse.annex.signer;
        statusBox.textContent = `Connected: ${currentAccount.slice(0, 6)}...${currentAccount.slice(-4)}`;
        statusBox.classList.remove('error');
        balanceContainer.classList.remove('hidden');

        // Get and display balances
        await updateBalances();

    } catch (error) {
        console.error('Wallet connection error:', error);
        statusBox.textContent = 'Error: Could not connect wallet';
        statusBox.classList.add('error');
        balanceContainer.classList.add('hidden');
    }
}

async function updateBalances() {
    if (!currentAccount) return;

    try {
        // Get VET balance
        const vetBalance = await connex.thor.account(currentAccount).get();
        document.getElementById('vet-balance').textContent = 
            `${formatBalance(vetBalance.balance)} VET`;

        // Get VTHO balance
        const vthoContract = '0x0000000000000000000000000000456E65726779';
        const vthoABI = {"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"type":"function"};
        
        const vthoMethod = connex.thor.account(vthoContract).method(vthoABI);
        const vthoBalance = await vthoMethod.call(currentAccount);
        document.getElementById('vtho-balance').textContent = 
            `${formatBalance(vthoBalance.decoded[0])} VTHO`;

    } catch (error) {
        console.error('Error fetching balances:', error);
    }
}

function formatBalance(balance) {
    return (parseInt(balance) / 1e18).toFixed(2);
} 