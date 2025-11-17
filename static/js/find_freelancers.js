document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('freelancer-results-grid');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-button');

    let allFreelancers = []; // Store data locally for fast filtering

    // 1. Fetch Data on Load
    fetchFreelancers();

    async function fetchFreelancers() {
        try {
            const res = await fetch('/get_all_freelancers');
            if (!res.ok) throw new Error("Failed to fetch data");
            
            allFreelancers = await res.json();
            renderCards(allFreelancers);

        } catch (err) {
            console.error(err);
            grid.innerHTML = `<div class="col-span-full text-center text-red-400">Failed to load profiles. Please try again later.</div>`;
        }
    }

    // 2. Render Cards
    function renderCards(freelancers) {
        grid.innerHTML = ""; // Clear loading text

        if (freelancers.length === 0) {
            grid.innerHTML = `<div class="col-span-full text-center text-light-muted">No freelancers found matching your criteria.</div>`;
            return;
        }

        freelancers.forEach(f => {
            // Generate Skills HTML
            const skillsHtml = f.skills.map(skill => 
                `<span class="bg-primary-dark text-blue-300 text-xs font-semibold px-3 py-1 rounded-full border border-gray-700">${skill}</span>`
            ).join('');

            // Generate Social Buttons (Only if link exists)
            let socialButtons = '';
            
            if (f.github && f.github.includes('http')) {
                socialButtons += `
                    <a href="${f.github}" target="_blank" class="flex items-center justify-center w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 text-white transition" title="GitHub">
                        <ion-icon name="logo-github" class="text-xl"></ion-icon>
                    </a>`;
            }

            if (f.linkedin && f.linkedin.includes('http')) {
                socialButtons += `
                    <a href="${f.linkedin}" target="_blank" class="flex items-center justify-center w-10 h-10 rounded-full bg-blue-700 hover:bg-blue-600 text-white transition" title="LinkedIn">
                        <ion-icon name="logo-linkedin" class="text-xl"></ion-icon>
                    </a>`;
            }

            // Generate Card HTML
            const card = document.createElement('div');
            card.className = "bg-primary rounded-2xl shadow-2xl border border-gray-700 overflow-hidden flex flex-col h-full transition duration-300 ease-in-out hover:border-blue-500 hover:-translate-y-1";
            
            card.innerHTML = `
                <div class="p-6">
                    <div class="flex items-center gap-3 mb-3">
                        <div class="w-10 h-10 rounded-full bg-primary-dark flex items-center justify-center text-blue-400 font-bold text-lg border border-gray-600">
                            ${f.name.charAt(0).toUpperCase()}
                        </div>
                        <span class="text-sm font-medium text-blue-400 truncate w-full">
                            ${f.wallet.substring(0, 6)}...${f.wallet.substring(f.wallet.length - 4)}
                        </span>
                    </div>
                    <h3 class="text-2xl font-bold text-white mb-1 truncate">${f.name}</h3>
                    <p class="text-xs text-gray-500 mb-3">Verified Builder</p>
                </div>

                <div class="px-6 pb-6 space-y-4 flex-grow">
                    <p class="text-light-muted text-sm line-clamp-3 h-[60px]">
                        ${f.bio || "No bio provided."}
                    </p>

                    <div>
                        <h4 class="text-sm font-semibold text-light mb-2">Skills</h4>
                        <div class="flex flex-wrap gap-2">
                            ${skillsHtml || '<span class="text-xs text-gray-500">No skills listed</span>'}
                        </div>
                    </div>
                </div>

                <div class="p-6 mt-auto border-t border-gray-700 bg-primary-dark/30 flex items-center justify-between">
                    <div class="flex gap-2">
                        ${socialButtons}
                    </div>

                    <button onclick="viewProfile('${f.wallet}')" class="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold shadow-lg hover:bg-blue-500 transition">
                        View Profile
                    </button>
                </div>
            `;

            grid.appendChild(card);
        });
    }

    // 3. Search Filtering Logic
    function filterFreelancers() {
        const query = searchInput.value.toLowerCase();
        
        const filtered = allFreelancers.filter(f => {
            const nameMatch = f.name.toLowerCase().includes(query);
            const skillMatch = f.skills.some(s => s.toLowerCase().includes(query));
            return nameMatch || skillMatch;
        });

        renderCards(filtered);
    }

    // Attach Search Listeners
    searchInput.addEventListener('keyup', filterFreelancers);
    searchBtn.addEventListener('click', filterFreelancers);
});

// Helper to redirect to a specific profile (future implementation)
function viewProfile(wallet) {
    // You can create a public profile view page later, e.g., /u/0x123...
    alert(`View Profile Feature coming soon for wallet:\n${wallet}`);
}