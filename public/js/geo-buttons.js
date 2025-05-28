document.addEventListener('DOMContentLoaded', function() {
  function attachGeoHandler(btn) {
    if (!btn) return;
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        alert('Geolocation only works on HTTPS or localhost. Please use a secure connection.');
        return;
      }
      if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser.');
        return;
      }
      btn.disabled = true;
      btn.textContent = 'Locating...';
      navigator.geolocation.getCurrentPosition(
        async function(position) {
          const { latitude, longitude } = position.coords;
          try {
            const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
            const res = await fetch(url);
            const data = await res.json();
            const city = data.address.city || data.address.town || data.address.village || data.address.hamlet;
            const province = data.address.state || data.address.region;
            function slugify(str) {
              return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            }
            if (province) {
              const provinceSlug = slugify(province);
              if (city) {
                const citySlug = slugify(city);
                window.location.href = `/${provinceSlug}/${citySlug}`;
              } else {
                window.location.href = `/${provinceSlug}`;
              }
            } else {
              alert('Could not determine your province.');
            }
          } catch (e) {
            alert('Could not determine your location.');
            console.error(e);
          }
          btn.disabled = false;
          btn.textContent = 'Find Stores Near Me';
        },
        function(error) {
          if (error.code === error.PERMISSION_DENIED) {
            alert('Location permission denied. Please allow access to use this feature.');
          } else {
            alert('Unable to retrieve your location.');
          }
          btn.disabled = false;
          btn.textContent = 'Find Stores Near Me';
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }
  attachGeoHandler(document.getElementById('find-near-me'));
  attachGeoHandler(document.getElementById('find-near-me-cta'));
}); 