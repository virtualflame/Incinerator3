async function handleWalletConnect() {
    const walletStatus = document.getElementById('wallet-status');
    const networkStatus = document.getElementById('network-status');
    const balanceContainer = document.getElementById('balance-container');
    const balanceError = document.getElementById('balance-error');
    
    try {
        // Reset any previous error states
        document.getElementById('connection-status').classList.remove('error');
        
        // Show connecting status
        walletStatus.textContent = 'Connecting to VeWorld TestNet...';
        networkStatus.textContent = 'Network: Checking TestNet...';

        // Check if VeWorld is installed
        if (typeof window.vechain === 'undefined') {
            throw new Error('Please install VeWorld wallet and switch to TestNet');
        }

        // Initialize if needed
        if (!connex) {
            const initialized = await initVeChain();
            if (!initialized) {
                throw new Error('Please switch to TestNet in VeWorld');
            }
        }
        
        const result = await connectVeChainWallet();
        
        if (result.success) {
            walletStatus.textContent = `Connected: ${formatAddress(result.address)}`;
            networkStatus.textContent = `Network: ${result.network}`;
            balanceContainer.classList.remove('hidden');
            await updateBalanceDisplay();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('TestNet connection error:', error);
        walletStatus.textContent = `Error: ${error.message}`;
        networkStatus.textContent = 'Network: Not Connected to TestNet';
        document.getElementById('connection-status').classList.add('error');
        balanceContainer.classList.add('hidden');
    }
}

async function updateBalanceDisplay() {
    const balanceError = document.getElementById('balance-error');
    
    try {
        console.log('Fetching balances...');
        const balances = await getBalances();
        console.log('Received balances:', balances);

        if (balances) {
            // Update main token displays
            const vetBalance = document.getElementById('vet-balance');
            const vthoBalance = document.getElementById('vtho-balance');
            const vetDetailBalance = document.getElementById('vet-balance-detail');
            const vthoDetailBalance = document.getElementById('vtho-balance-detail');

            console.log('Updating display elements:', {
                vetBalance,
                vthoBalance,
                vetDetailBalance,
                vthoDetailBalance
            });

            if (vetBalance) vetBalance.textContent = balances.vet;
            if (vthoBalance) vthoBalance.textContent = balances.vtho;
            if (vetDetailBalance) vetDetailBalance.textContent = `${balances.vet} VET`;
            if (vthoDetailBalance) vthoDetailBalance.textContent = `${balances.vtho} VTHO`;
            
            balanceError.classList.add('hidden');
        } else {
            throw new Error('Could not fetch TestNet balances');
        }
    } catch (error) {
        console.error('Balance display error:', error);
        balanceError.textContent = `Error: ${error.message}`;
        balanceError.classList.remove('hidden');
    }
}

function formatAddress(address) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
} 