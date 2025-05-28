// Province name to code mapping for flexible searching
const provinceMapping = {
  'alberta': ['alberta', 'ab'],
  'british columbia': ['british columbia', 'bc'],
  'manitoba': ['manitoba', 'mb'],
  'new brunswick': ['new brunswick', 'nb'],
  'newfoundland and labrador': ['newfoundland and labrador', 'nl', 'newfoundland', 'labrador'],
  'northwest territories': ['northwest territories', 'nt', 'nwt'],
  'nova scotia': ['nova scotia', 'ns'],
  'nunavut': ['nunavut', 'nu'],
  'ontario': ['ontario', 'on'],
  'prince edward island': ['prince edward island', 'pei', 'pe'],
  'quebec': ['quebec', 'qc', 'québec'],
  'saskatchewan': ['saskatchewan', 'sk'],
  'yukon': ['yukon', 'yt']
};

document.addEventListener('DOMContentLoaded', function() {
  const storeCards = Array.from(document.querySelectorAll('.store-card'));
  const searchInput = document.getElementById('search');
  const provinceSelect = document.getElementById('province');
  const cityInput = document.getElementById('city');
  const resultsCount = document.getElementById('results-count');
  const storeGrid = document.getElementById('store-grid');
  const clearBtn = document.getElementById('clear-filters');

  function matchesProvince(storeProvince, searchProvince) {
    if (!searchProvince) return true;
    const storeProvinceNormalized = storeProvince.toLowerCase().trim();
    const searchProvinceNormalized = searchProvince.toLowerCase().trim();
    if (storeProvinceNormalized === searchProvinceNormalized) {
      return true;
    }
    for (const [fullName, variants] of Object.entries(provinceMapping)) {
      if (variants.includes(searchProvinceNormalized)) {
        return variants.includes(storeProvinceNormalized) || storeProvinceNormalized === fullName;
      }
    }
    return false;
  }

  function filterStores() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const provinceTerm = provinceSelect.value.toLowerCase().trim();
    const cityTerm = cityInput.value.toLowerCase().trim();
    let visibleCount = 0;
    storeCards.forEach(card => {
      const name = card.getAttribute('data-name') || '';
      const province = card.getAttribute('data-province') || '';
      const city = card.getAttribute('data-city') || '';
      const matchesSearch = !searchTerm || name.includes(searchTerm);
      const matchesProvinceFilter = matchesProvince(province, provinceTerm);
      const matchesCity = !cityTerm || city.includes(cityTerm);
      const isVisible = matchesSearch && matchesProvinceFilter && matchesCity;
      if (isVisible) {
        card.style.display = 'block';
        card.classList.remove('hidden');
        visibleCount++;
      } else {
        card.style.display = 'none';
        card.classList.add('hidden');
      }
    });
    resultsCount.textContent = visibleCount;
    storeGrid.style.display = visibleCount === 0 ? 'none' : 'grid';
  }

  if (searchInput && provinceSelect && cityInput && clearBtn) {
    searchInput.addEventListener('input', filterStores);
    provinceSelect.addEventListener('change', filterStores);
    cityInput.addEventListener('input', filterStores);
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      provinceSelect.value = '';
      cityInput.value = '';
      filterStores();
      searchInput.focus();
    });
    filterStores();
  }
}); 