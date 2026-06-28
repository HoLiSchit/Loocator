document.addEventListener('DOMContentLoaded', () => {

    // --- NEU: Besucherzähler sauber aufrufen ---
    fetch('counter.php?hit=1').catch(e => console.log('Counter-Error:', e));
    // ------------------------------------------

    const htmlTag = document.getElementById('html-tag');
    htmlTag.lang = userLang;

    document.querySelectorAll('[data-i18n]').forEach(el => {
        el.innerText = t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
    });
    document.querySelector('[data-i18n="impressum"]').href = "mailto:info@loocator.org";

    function showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        
        let bgColor = 'bg-blue-600';
        if (type === 'error') bgColor = 'bg-red-600';
        if (type === 'success') bgColor = 'bg-green-600';

        toast.className = `toast-enter flex items-center justify-center p-3 rounded-lg shadow-lg text-white text-sm font-bold ${bgColor}`;
        toast.innerText = message;
        
        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.remove('toast-enter');
            toast.classList.add('toast-exit');
            toast.addEventListener('animationend', () => toast.remove());
        }, 3000);
    }

    const customAlert = (msg) => showToast(msg, 'error');

    const offlineBanner = document.getElementById('offline-banner');
    function updateOnlineStatus() {
        if (navigator.onLine) offlineBanner.classList.add('hidden');
        else offlineBanner.classList.remove('hidden');
    }
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();

    const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator.standalone);
    if (isIos && !isInStandaloneMode) {
        document.getElementById('ios-install-hint').classList.remove('hidden');
    }

    const themeToggleBtn = document.getElementById('btn-theme-toggle');
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        htmlTag.classList.add('dark');
        themeToggleBtn.innerText = '☀️';
        themeToggleBtn.classList.add('bg-gray-800', 'text-white');
        themeToggleBtn.classList.remove('bg-gray-100', 'text-gray-800');
    } else {
        htmlTag.classList.remove('dark');
        themeToggleBtn.innerText = '🌙';
        themeToggleBtn.classList.add('bg-gray-100', 'text-gray-800');
        themeToggleBtn.classList.remove('bg-gray-800', 'text-white');
    }

    themeToggleBtn.addEventListener('click', () => {
        if (htmlTag.classList.contains('dark')) {
            htmlTag.classList.remove('dark');
            localStorage.theme = 'light';
            themeToggleBtn.innerText = '🌙';
            themeToggleBtn.classList.add('bg-gray-100', 'text-gray-800');
            themeToggleBtn.classList.remove('bg-gray-800', 'text-white');
        } else {
            htmlTag.classList.add('dark');
            localStorage.theme = 'dark';
            themeToggleBtn.innerText = '☀️';
            themeToggleBtn.classList.add('bg-gray-800', 'text-white');
            themeToggleBtn.classList.remove('bg-gray-100', 'text-gray-800');
        }
    });

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js');
    }

    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        document.getElementById('btn-install').classList.remove('hidden');
    });

    document.getElementById('btn-install').addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                document.getElementById('btn-install').classList.add('hidden');
            }
            deferredPrompt = null;
        }
    });

    const map = L.map('map', { zoomControl: false }).setView([49.0069, 8.4037], 14);

    const layerOSM = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        className: 'osm-tiles'
    });

    const layerSat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles © Esri'
    });

    layerOSM.addTo(map);

    let isSatMode = false;
    document.getElementById('btn-layer-toggle').addEventListener('click', (e) => {
        isSatMode = !isSatMode;
        const mapDiv = document.getElementById('map');
        if (isSatMode) {
            map.removeLayer(layerOSM);
            layerSat.addTo(map);
            e.target.innerText = '🌍';
            e.target.classList.add('bg-blue-100');
            mapDiv.classList.add('is-sat-mode');
        } else {
            map.removeLayer(layerSat);
            layerOSM.addTo(map);
            e.target.innerText = '🗺️';
            e.target.classList.remove('bg-blue-100');
            mapDiv.classList.remove('is-sat-mode');
        }
    });

    const markerClusterGroup = L.markerClusterGroup({
        disableClusteringAtZoom: 16,
        maxClusterRadius: 50,
        iconCreateFunction: function(cluster) {
            const childCount = cluster.getChildCount();
            const children = cluster.getAllChildMarkers();
            
            let hasTopRated = false;
            let hasOpen247 = false;
            let hasChanging = false;
            let hasDefect = false;

            children.forEach(marker => {
                if (marker.options.isTopRated) hasTopRated = true;
                if (marker.options.is247) hasOpen247 = true;
                if (marker.options.hasChanging) hasChanging = true;
                if (marker.options.isDefect) hasDefect = true;
            });

            let indicatorsHtml = '';
            
            if (hasTopRated) indicatorsHtml += `<div class="w-2.5 h-2.5 bg-yellow-400 rounded-full border border-white"></div>`;
            if (hasOpen247) indicatorsHtml += `<div class="w-2.5 h-2.5 bg-green-500 rounded-full border border-white"></div>`;
            if (hasChanging) indicatorsHtml += `<div class="w-2.5 h-2.5 bg-purple-500 rounded-full border border-white"></div>`;
            if (hasDefect) indicatorsHtml += `<div class="w-2.5 h-2.5 bg-red-600 rounded-full border border-white"></div>`;

            return L.divIcon({
                html: `
                    <div class="relative flex items-center justify-center w-10 h-10 bg-blue-600/90 text-white font-bold rounded-full shadow-md border-2 border-white">
                        <span>${childCount}</span>
                        <div class="absolute -bottom-1.5 flex gap-0.5 justify-center w-full">
                            ${indicatorsHtml}
                        </div>
                    </div>
                `,
                className: 'custom-cluster-icon bg-transparent',
                iconSize: L.point(40, 40)
            });
        }
    });

    map.addLayer(markerClusterGroup);

    let userLocation = null;
    let locationMarker = null;
    let searchMarker = null;
    let activeMarkers = [];
    let currentToiletData = null;
    let isFetching = false;
    let initialLoadComplete = false;
    let globalRatingsDb = {};
    let routingLine = null;
    let addressCache = {};
    let autoFollow = false;
    let allToilets = [];

    const btnLocation = document.getElementById('btn-location');
    const mainMenu = document.getElementById('main-menu');
    const btnOpenMenu = document.getElementById('btn-open-menu');
    const btnCloseMenu = document.getElementById('btn-close-menu');
    const searchInput = document.getElementById('search-input');
    const searchSuggestions = document.getElementById('search-suggestions');
    const btnCloseSheet = document.getElementById('btn-close-sheet');

    function updateLocationButtonUI() {
        if (autoFollow) {
            btnLocation.classList.remove('bg-white', 'text-blue-600', 'dark:bg-gray-800', 'dark:text-blue-400');
            btnLocation.classList.add('bg-blue-600', 'text-white');
        } else {
            btnLocation.classList.remove('bg-blue-600', 'text-white');
            btnLocation.classList.add('bg-white', 'text-blue-600', 'dark:bg-gray-800', 'dark:text-blue-400');
        }
    }

    map.on('dragstart', () => {
        if (autoFollow) {
            autoFollow = false;
            updateLocationButtonUI();
            map.stopLocate();
        }
    });

    map.on('locationfound', function(e) {
        userLocation = e.latlng;
        if (!locationMarker) {
            map.eachLayer((layer) => {
                if(layer.options && layer.options.color === '#3b82f6') {
                    map.removeLayer(layer);
                }
            });
            locationMarker = L.circleMarker(e.latlng, {
                color: '#3b82f6', fillOpacity: 1, radius: 8
            }).addTo(map);
        } else {
            locationMarker.setLatLng(e.latlng);
        }
        if (autoFollow) {
            map.setView(e.latlng, map.getZoom());
        }
    });

    btnLocation.addEventListener('click', () => {
        if (navigator.geolocation) {
            document.getElementById('loading-spinner').classList.remove('hidden');
            
            const successCallback = (position) => {
                document.getElementById('loading-spinner').classList.add('hidden');
                userLocation = L.latLng(position.coords.latitude, position.coords.longitude);
                autoFollow = true;
                updateLocationButtonUI();
                map.setView(userLocation, 16);
                map.locate({ watch: true, enableHighAccuracy: true, timeout: 30000, maximumAge: 10000 });
            };

            const errorCallback = (error) => {
                if (error.code === 3) {
                    navigator.geolocation.getCurrentPosition(
                        successCallback,
                        (errFallback) => {
                            document.getElementById('loading-spinner').classList.add('hidden');
                            customAlert(t('geoFallbackError', {code: errFallback.code, msg: errFallback.message}));
                            autoFollow = false;
                            updateLocationButtonUI();
                        },
                        { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
                    );
                    return;
                }
                document.getElementById('loading-spinner').classList.add('hidden');
                customAlert(t('geoError', {code: error.code, msg: error.message}));
                autoFollow = false;
                updateLocationButtonUI();
            };

            navigator.geolocation.getCurrentPosition(successCallback, errorCallback, { enableHighAccuracy: true, timeout: 20000, maximumAge: 10000 });
        } else {
            customAlert(t('geoNotSupported'));
        }
    });

    function toggleMenu(show) {
        if(show) {
            mainMenu.classList.remove('hidden');
            btnOpenMenu.classList.add('hidden');
        } else {
            mainMenu.classList.add('hidden');
            btnOpenMenu.classList.remove('hidden');
            searchSuggestions.classList.add('hidden');
            searchInput.blur();
        }
    }

    btnOpenMenu.addEventListener('click', () => toggleMenu(true));
    btnCloseMenu.addEventListener('click', () => toggleMenu(false));

    function jumpToSearchResult(lat, lon, name) {
        map.setView([lat, lon], 18);
        searchInput.value = name;
        toggleMenu(false);
        if(autoFollow) {
            autoFollow = false;
            updateLocationButtonUI();
            map.stopLocate();
        }
        if (searchMarker) map.removeLayer(searchMarker);
        searchMarker = L.marker([lat, lon], {
            icon: L.divIcon({
                className: 'bg-transparent text-4xl drop-shadow-lg',
                html: '📍',
                iconSize: [40, 40],
                iconAnchor: [20, 20]
            })
        }).addTo(map);
    }

    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value;
        if (query.length < 3) {
            searchSuggestions.classList.add('hidden');
            return;
        }

        searchTimeout = setTimeout(async () => {
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=de,at,ch,us,uk`);
                const data = await res.json();
                
                searchSuggestions.innerHTML = '';
                if (data.length > 0) {
                    data.forEach(place => {
                        const li = document.createElement('li');
                        li.className = 'p-3 border-b border-gray-100 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-gray-600 cursor-pointer truncate font-medium';
                        const shortName = place.display_name.split(',').slice(0, 3).join(',');
                        li.innerText = shortName;
                        li.onclick = () => jumpToSearchResult(place.lat, place.lon, shortName);
                        searchSuggestions.appendChild(li);
                    });
                    searchSuggestions.classList.remove('hidden');
                } else {
                    searchSuggestions.classList.add('hidden');
                }
            } catch (e) { }
        }, 500);
    });

    document.getElementById('search-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const query = searchInput.value;
        if (!query) return;

        document.getElementById('loading-spinner').classList.remove('hidden');
        searchSuggestions.classList.add('hidden');

        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
            const data = await res.json();
            if (data && data.length > 0) {
                jumpToSearchResult(data[0].lat, data[0].lon, searchInput.value);
            } else {
                customAlert(t('alertNotFound'));
            }
        } catch (e) {
            customAlert(t('searchFailed'));
        } finally {
            document.getElementById('loading-spinner').classList.add('hidden');
        }
    });

    const filterSelectors = ['filter-public', 'filter-eurokey', 'filter-changing', 'filter-open', 'filter-success', 'filter-favorites', 'filter-free'];
    filterSelectors.forEach(id => {
        if(document.getElementById(id)) {
            document.getElementById(id).addEventListener('change', renderMarkers);
        }
    });

    // --- NEUES MELDEN UI LOGIK ---
    const crosshair = document.getElementById('crosshair');
    const targetBottomBar = document.getElementById('target-bottom-bar');
    const reportModal = document.getElementById('report-modal');
    
    let reportMode = 'new'; // 'new' = via Menü, 'existing' = via Bottom-Sheet

    // 1A. Modus starten (via Menü -> Fadenkreuz zeigen)
    document.getElementById('btn-report').addEventListener('click', () => {
        reportMode = 'new';
        document.getElementById('label-rep-1').style.display = 'flex';
        document.getElementById('label-rep-2').style.display = 'flex';
        document.getElementById('radio-rep-1').checked = true;
        
        toggleMenu(false);
        crosshair.classList.remove('hidden');
        targetBottomBar.classList.remove('hidden');
    });

    // 1B. Modus starten (via Bottom-Sheet -> Direkt zum Modal)
    if(document.getElementById('btn-report-existing')) {
        document.getElementById('btn-report-existing').addEventListener('click', () => {
            reportMode = 'existing';
            // Für bestehende WCs macht "Hier fehlt ein WC" keinen Sinn, also ausblenden
            document.getElementById('label-rep-1').style.display = 'none';
            document.getElementById('label-rep-2').style.display = 'none';
            document.getElementById('radio-rep-3').checked = true;
            
            closeSheet();
            reportModal.classList.remove('hidden');
        });
    }

    // 2. Modus abbrechen
    document.getElementById('btn-cancel-target').addEventListener('click', () => {
        crosshair.classList.add('hidden');
        targetBottomBar.classList.add('hidden');
    });

    // 3. Ort bestaetigt -> Formular zeigen
    document.getElementById('btn-confirm-target').addEventListener('click', () => {
        targetBottomBar.classList.add('hidden');
        reportModal.classList.remove('hidden');
    });

    // 4. Formular schliessen (X-Button)
    document.getElementById('btn-close-report').addEventListener('click', () => {
        reportModal.classList.add('hidden');
        crosshair.classList.add('hidden');
    });

    // 5. Daten an OSM senden
    document.getElementById('btn-submit-report').addEventListener('click', async () => {
        let lat, lon, finalOsmText;
        const typeRadio = document.querySelector('input[name="report-type"]:checked').value;
        const noteText = document.getElementById('report-note').value.trim();
        
        if (reportMode === 'new') {
            const center = map.getCenter();
            lat = center.lat;
            lon = center.lng;
            finalOsmText = `[Loocator App Report] Issue: ${typeRadio}`;
        } else {
            lat = currentToiletData.lat || (currentToiletData.center && currentToiletData.center.lat);
            lon = currentToiletData.lon || (currentToiletData.center && currentToiletData.center.lon);
            finalOsmText = `[Loocator App Report] Issue with existing WC (OSM-ID: ${currentToiletData.id}): ${typeRadio}`;
        }
        
        if (noteText.length > 0) {
            finalOsmText += ` | User note: ${noteText}`;
        }
        
        const url = `https://api.openstreetmap.org/api/0.6/notes?lat=${lat}&lon=${lon}&text=${encodeURIComponent(finalOsmText)}`;
        
        const submitBtn = document.getElementById('btn-submit-report');
        const oldText = submitBtn.innerText;
        submitBtn.innerText = '...';
        submitBtn.disabled = true;

        try {
            await fetch(url, { method: 'POST' }); 
            showToast(t('alertReportSuccess'), 'success');
            
            reportModal.classList.add('hidden');
            crosshair.classList.add('hidden');
            document.getElementById('report-note').value = '';
        } catch(e) {
            customAlert(t('alertError'));
        } finally {
            submitBtn.innerText = oldText;
            submitBtn.disabled = false;
        }
    });
    // ----------------------------------------------------

    function isLikelyClosedNow(openingHoursStr) {
        if (!openingHoursStr || openingHoursStr === '24/7') return false;
        const timeMatch = openingHoursStr.match(/(\d{2}):(\d{2})-(\d{2}):(\d{2})/);
        if (timeMatch) {
            const now = new Date();
            const currentMinutes = now.getHours() * 60 + now.getMinutes();
            const startMinutes = parseInt(timeMatch[1]) * 60 + parseInt(timeMatch[2]);
            const endMinutes = parseInt(timeMatch[3]) * 60 + parseInt(timeMatch[4]);
            if (currentMinutes < startMinutes || currentMinutes > endMinutes) return true;
        }
        return false;
    }

    let fetchTimeout;
    map.on('moveend', () => {
        clearTimeout(fetchTimeout);
        fetchTimeout = setTimeout(fetchToilets, 500);
    });

    function removeSplashScreen() {
        if (!initialLoadComplete) {
            initialLoadComplete = true;
            const splash = document.getElementById('splash-screen');
            if (splash) {
                splash.classList.add('opacity-0');
                setTimeout(() => {
                    splash.remove();
                    if (!localStorage.getItem('loocator_tutorial_seen')) {
                        document.getElementById('tutorial-modal').classList.remove('hidden');
                    }
                }, 500);
                toggleMenu(false);
            }
        }
    }

    const btnCloseTutorial = document.getElementById('btn-close-tutorial');
    if (btnCloseTutorial) {
        btnCloseTutorial.addEventListener('click', () => {
            localStorage.setItem('loocator_tutorial_seen', 'true');
            const modal = document.getElementById('tutorial-modal');
            modal.classList.add('opacity-0');
            setTimeout(() => {
                modal.classList.add('hidden');
                modal.classList.remove('opacity-0');
            }, 300);
        });
    }

    async function fetchToilets() {
        if (isFetching || map.getZoom() < 12) return;
        isFetching = true;
        document.getElementById('loading-spinner').classList.remove('hidden');

        try {
            const dbRes = await fetch('backend.php?all=1');
            globalRatingsDb = await dbRes.json();
            
            let ratedWcs = 0;
            let totalVotes = 0;
            for (const key in globalRatingsDb) {
                const wc = globalRatingsDb[key];
                ratedWcs++;
                totalVotes += parseInt(wc.usable_yes || 0);
                totalVotes += parseInt(wc.usable_no || 0);
                totalVotes += parseInt(wc.cleanliness_count || 0);
            }
            const statsEl = document.getElementById('app-stats');
            if (ratedWcs > 0 && statsEl) {
                statsEl.innerText = t('statsText', {toilets: ratedWcs, votes: totalVotes});
                statsEl.classList.remove('hidden');
            }
            
        } catch (e) { }

        const bounds = map.getBounds();
        const query = `
            [out:json][timeout:25];
            (
              nwr["amenity"="toilets"](${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});
              nwr["toilets"="yes"](${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});
              nwr["toilets:eurokey"="yes"](${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});
              nwr["toilets:wheelchair"="yes"](${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});
              nwr["toilets:wheelchair"="designated"](${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});
            );
            out center;
        `;

        try {
            const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
            const data = await res.json();
            allToilets = data.elements;
            renderMarkers();
        } catch (error) {
            console.error(error);
        } finally {
            isFetching = false;
            document.getElementById('loading-spinner').classList.add('hidden');
            removeSplashScreen();
        }
    }

    function renderMarkers() {
        markerClusterGroup.clearLayers();
        activeMarkers = [];

        const reqPub = document.getElementById('filter-public').checked;
        const reqEuro = document.getElementById('filter-eurokey').checked;
        const reqChange = document.getElementById('filter-changing').checked;
        const reqOpen = document.getElementById('filter-open').checked;
        const reqSucc = document.getElementById('filter-success').checked;
        const reqFav = document.getElementById('filter-favorites').checked;
        const freeCheckbox = document.getElementById('filter-free');
        const reqFree = freeCheckbox ? freeCheckbox.checked : false;

        let savedFavs = JSON.parse(localStorage.getItem('loocator_favs') || '[]');

        allToilets.forEach(toilet => {
            if (reqFav && !savedFavs.includes(toilet.id)) return;

            const tags = toilet.tags || {};
            const lat = toilet.lat || (toilet.center && toilet.center.lat);
            const lon = toilet.lon || (toilet.center && toilet.center.lon);

            if (!lat || !lon) return;

            const access = tags.access || tags['toilets:access'] || 'yes';
            if (reqPub && (access === 'private' || access === 'customers')) return;

            const isExplicitEurokey = tags['central_key'] === 'eurokey' || tags['eurokey'] === 'yes' || tags.access === 'central_key' || tags['toilets:eurokey'] === 'yes' || tags['toilets:central_key'] === 'eurokey';
            const isWheelchair = tags.wheelchair === 'yes' || tags.wheelchair === 'designated' || tags['toilets:wheelchair'] === 'yes' || tags['toilets:wheelchair'] === 'designated';
            const isEurokeyOrWheelchair = isExplicitEurokey || isWheelchair;

            if (reqEuro && !isEurokeyOrWheelchair) return;

            const hasChanging = tags['changing_table'] === 'yes' || tags.diaper === 'yes';
            if (reqChange && !hasChanging) return;

            if (reqOpen && isLikelyClosedNow(tags.opening_hours)) return;

            if (reqFree) {
                const fee = tags.fee || tags['toilets:fee'] || tags.charge;
                if (fee && !['no', '0', 'false', 'none'].includes(fee.toLowerCase())) return;
            }

            let isDefect = false;
            let isTopRated = false;
            const rating = globalRatingsDb[toilet.id];
            
            if (rating) {
                const total = rating.usable_yes + rating.usable_no;
                if (total > 1) {
                    const successRate = rating.usable_yes / total;
                    if (successRate < 0.3) isDefect = true;
                    if (reqSucc && successRate < 0.65) return;
                    if (total > 2 && successRate > 0.85) isTopRated = true;
                }
            }

            const is247 = tags.opening_hours === '24/7';

            let baseClass = isEurokeyOrWheelchair 
                ? 'text-2xl bg-yellow-300 dark:bg-yellow-600 rounded-full border-2 border-yellow-500 p-1 shadow-md relative' 
                : 'text-2xl relative bg-white dark:bg-gray-600 rounded-full border border-gray-200 dark:border-gray-500 p-1 shadow-md';
            
            let iconSymbol = isEurokeyOrWheelchair ? '🔑' : '🚽';
            
            let dotHtml = is247 ? `<div class="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full shadow-sm animate-pulse"></div>` : '';
            let defectHtml = isDefect ? `<div class="absolute -bottom-1 -left-1 w-4 h-4 bg-red-600 rounded-full shadow border-2 border-white dark:border-gray-800"></div>` : '';
            let changingHtml = hasChanging ? `<div class="absolute -bottom-1 -right-1 w-4 h-4 bg-purple-500 rounded-full shadow border-2 border-white dark:border-gray-800"></div>` : '';
            
            let badgeHtml = '';
            if (savedFavs.includes(toilet.id)) {
                badgeHtml = `<div class="absolute -top-2 -left-2 text-sm drop-shadow-md">❤️</div>`;
            } else if (isTopRated) {
                badgeHtml = `<div class="absolute -top-1 -left-1 w-4 h-4 bg-yellow-400 rounded-full shadow border-2 border-white dark:border-gray-800"></div>`;
            }

            const customIcon = L.divIcon({
                className: baseClass,
                html: `<div class="flex items-center justify-center w-full h-full">${iconSymbol}</div>${dotHtml}${defectHtml}${changingHtml}${badgeHtml}`,
                iconSize: [36, 36]
            });

            const marker = L.marker([lat, lon], { 
                icon: customIcon,
                isTopRated: isTopRated,
                is247: is247,
                hasChanging: hasChanging,
                isDefect: isDefect
            });

            marker.on('click', () => {
                openSheet(toilet, isEurokeyOrWheelchair, isExplicitEurokey, isWheelchair, is247, hasChanging, isDefect, isTopRated, lat, lon);
                toggleMenu(false);
            });

            markerClusterGroup.addLayer(marker);
            activeMarkers.push(marker);
        });
    }

    map.on('click', () => {
        closeSheet();
        toggleMenu(false);
        if (searchMarker) {
            map.removeLayer(searchMarker);
            searchMarker = null;
        }
    });

    btnCloseSheet.addEventListener('click', closeSheet);

    function closeSheet() {
        document.getElementById('bottom-sheet').classList.add('translate-y-full');
        if (routingLine) {
            map.removeLayer(routingLine);
            routingLine = null;
        }
    }

    async function openSheet(toilet, isEurokeyOrWheelchair, isExplicitEurokey, isWheelchair, is247, hasChanging, isDefect, isTopRated, lat, lon) {
        currentToiletData = toilet;
        const tags = toilet.tags || {};
        
        document.getElementById('routing-warning').classList.add('hidden');

        if (routingLine) map.removeLayer(routingLine);

        if (userLocation) {
            routingLine = L.polyline([userLocation, [lat, lon]], {
                color: '#9ca3af', weight: 4, dashArray: '8, 8', lineCap: 'round'
            }).addTo(map);

            fetch(`https://router.project-osrm.org/route/v1/foot/${userLocation.lng},${userLocation.lat};${lon},${lat}?geometries=geojson`)
                .then(res => res.json())
                .then(data => {
                    if(data.routes && data.routes.length > 0) {
                        map.removeLayer(routingLine);
                        routingLine = L.geoJSON(data.routes[0].geometry, {
                            style: { color: '#3b82f6', weight: 5, opacity: 0.8 }
                        }).addTo(map);
                        
                        if (isEurokeyOrWheelchair) {
                            document.getElementById('routing-warning').classList.remove('hidden');
                        }
                    }
                }).catch(() => console.log('Routing fallback active'));
        }

        let baseType = t('tPublic');
        if (tags.highway === 'services') baseType = t('tRestStop');
        else if (tags.highway === 'rest_area') baseType = t('tRestArea');
        else if (tags.amenity === 'fuel') baseType = t('tFuel');

        if (isEurokeyOrWheelchair) {
            if (isExplicitEurokey) baseType += t('tAddEuro');
            else if (isWheelchair) baseType += t('tAddWheel');
        }

        document.getElementById('sheet-title').innerText = baseType;
        updateFavButtonUI();

        const distEl = document.getElementById('sheet-distance');
        if (userLocation) {
            const targetLatLng = L.latLng(lat, lon);
            const dist = Math.round(map.distance(userLocation, targetLatLng));
            if (dist > 1000) distEl.innerText = t('distKm', {dist: (dist/1000).toFixed(1)});
            else distEl.innerText = t('distM', {dist: dist});
        } else {
            distEl.innerText = '';
        }

        const subtitleEl = document.getElementById('sheet-subtitle');
        if (tags.name) {
            subtitleEl.innerText = tags.name;
            subtitleEl.classList.remove('hidden');
        } else {
            subtitleEl.classList.add('hidden');
        }

        const addressEl = document.getElementById('sheet-address');
        let addressParts = [];
        if (tags['addr:street']) {
            let streetStr = tags['addr:street'];
            if (tags['addr:housenumber']) streetStr += ' ' + tags['addr:housenumber'];
            addressParts.push(streetStr);
        }
        let cityStr = [];
        if (tags['addr:postcode']) cityStr.push(tags['addr:postcode']);
        if (tags['addr:city']) cityStr.push(tags['addr:city']);
        if (cityStr.length > 0) addressParts.push(cityStr.join(' '));

        if (addressParts.length > 0) {
            addressEl.innerText = addressParts.join(', ');
            addressEl.classList.remove('hidden');
        } else {
            const cacheKey = `${lat.toFixed(5)},${lon.toFixed(5)}`;
            if (addressCache[cacheKey] !== undefined) {
                if (addressCache[cacheKey] !== '') {
                    addressEl.innerText = addressCache[cacheKey];
                    addressEl.classList.remove('hidden');
                } else {
                    addressEl.classList.add('hidden');
                }
            } else {
                addressEl.innerText = t('addrLoading');
                addressEl.classList.remove('hidden');
                fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`)
                    .then(res => res.json())
                    .then(data => {
                        if (data && data.address) {
                            let a = data.address;
                            let road = a.road || a.pedestrian || a.footway || a.path || a.suburb;
                            let house = a.housenumber || '';
                            let city = a.city || a.town || a.village || a.county || '';
                            let post = a.postcode || '';
                            let str = [];
                            if (road) str.push(road + (house ? ' ' + house : ''));
                            let cStr = [];
                            if (post) cStr.push(post);
                            if (city) cStr.push(city);
                            if (cStr.length > 0) str.push(cStr.join(' '));
                            
                            if (str.length > 0) {
                                const fullAddress = str.join(', ');
                                addressCache[cacheKey] = fullAddress;
                                addressEl.innerText = fullAddress;
                            } else {
                                addressCache[cacheKey] = '';
                                addressEl.classList.add('hidden');
                            }
                        } else {
                            addressCache[cacheKey] = '';
                            addressEl.classList.add('hidden');
                        }
                    }).catch(() => {
                        addressEl.classList.add('hidden');
                    });
            }
        }

        const noteEl = document.getElementById('sheet-note');
        let extraNotes = [];
        if (tags.level !== undefined) {
            let lvl = parseInt(tags.level);
            let lvlTxt = t('levelInfo');
            if (lvl === 0) lvlTxt = t('levelEG');
            else if (lvl < 0) lvlTxt = t('levelUG', {lvl: Math.abs(lvl)});
            else if (lvl > 0) lvlTxt = t('levelOG', {lvl: lvl});
            extraNotes.push(lvlTxt);
        }
        if (tags.description) extraNotes.push(tags.description);
        
        if (extraNotes.length > 0) {
            noteEl.innerText = extraNotes.join(' | ');
            noteEl.classList.remove('hidden');
        } else {
            noteEl.classList.add('hidden');
        }

        let genderInfo = '';
        if (tags.unisex === 'yes') genderInfo = t('accUnisex');
        else if (tags.male === 'yes' && tags.female === 'yes') genderInfo = t('accBoth');
        else if (tags.female === 'yes') genderInfo = t('accFemale');
        else if (tags.male === 'yes') genderInfo = t('accMale');

        let info = [];
        if(isDefect) info.push(t('iDefect'));
        if(isTopRated && !isDefect) info.push(t('iSuccess'));
        if(genderInfo) info.push(genderInfo);
        
        if(is247) info.push(t('i247'));
        else if (tags.opening_hours) info.push(t('iHours') + tags.opening_hours);
        
        if(tags.fee || tags['toilets:fee']) info.push(t('iCost') + (tags.fee || tags['toilets:fee']));
        if(!isWheelchair && (tags.wheelchair || tags['toilets:wheelchair'])) info.push(t('iWheel') + (tags.wheelchair || tags['toilets:wheelchair']));
        if(hasChanging) info.push(t('iChanging'));

        document.getElementById('sheet-info').innerText = info.length ? info.join(' | ') : t('iNone');

        document.getElementById('btn-navigate').onclick = () => {
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
            if (isIOS) {
                window.location.href = `http://maps.apple.com/?daddr=${lat},${lon}`;
            } else {
                window.location.href = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
            }
        };

        document.getElementById('btn-share').onclick = () => {
            const shareUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
            if (navigator.share) {
                navigator.share({
                    title: 'Loocator',
                    text: t('shareText') + ' ' + baseType,
                    url: shareUrl
                }).catch(() => {});
            } else {
                navigator.clipboard.writeText(shareUrl);
                showToast(t('alertCopied'), 'success');
            }
        };

        document.getElementById('stat-usable').innerText = t('statLoading');
        document.getElementById('stat-clean').innerText = t('statLoading');

        document.getElementById('bottom-sheet').classList.remove('translate-y-full');

        await loadRatings(toilet.id);
        checkVotedStatus(toilet.id);
    }

    document.getElementById('btn-fav').addEventListener('click', () => {
        if (!currentToiletData) return;
        let favs = JSON.parse(localStorage.getItem('loocator_favs') || '[]');
        if (favs.includes(currentToiletData.id)) {
            favs = favs.filter(id => id !== currentToiletData.id);
        } else {
            favs.push(currentToiletData.id);
        }
        localStorage.setItem('loocator_favs', JSON.stringify(favs));
        updateFavButtonUI();
        renderMarkers();
    });

    function updateFavButtonUI() {
        if (!currentToiletData) return;
        let favs = JSON.parse(localStorage.getItem('loocator_favs') || '[]');
        if (favs.includes(currentToiletData.id)) {
            document.getElementById('btn-fav').innerText = '❤️';
        } else {
            document.getElementById('btn-fav').innerText = '🤍';
        }
    }

    async function loadRatings(osmId) {
        try {
            const res = await fetch(`backend.php?id=${osmId}`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            
            const yesVotes = parseInt(data.usable_yes || 0);
            const noVotes = parseInt(data.usable_no || 0);
            const totalVotes = yesVotes + noVotes;

            if (totalVotes === 0) {
                document.getElementById('stat-usable').innerText = t('statNoData');
            } else {
                const percent = Math.round((yesVotes / totalVotes) * 100);
                document.getElementById('stat-usable').innerText = t('successRate', {percent: percent, total: totalVotes});
            }

            const cleanCount = parseInt(data.cleanliness_count || 0);
            const cleanSum = parseInt(data.cleanliness_sum || 0);

            if (cleanCount === 0) {
                document.getElementById('stat-clean').innerText = t('statNoRating');
            } else {
                const avg = (cleanSum / cleanCount).toFixed(1);
                document.getElementById('stat-clean').innerText = t('cleanRate', {avg: avg, count: cleanCount});
            }

        } catch(e) {
            document.getElementById('stat-usable').innerText = t('statLoadError');
            document.getElementById('stat-clean').innerText = t('statLoadError');
        }
    }

    async function sendVote(payload) {
        payload.id = currentToiletData.id;
        try {
            await fetch('backend.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const voted = JSON.parse(localStorage.getItem('loocator_voted') || '{}');
            if(!voted[payload.id]) voted[payload.id] = {};
            if(payload.usable) voted[payload.id].usable = true;
            if(payload.cleanliness) voted[payload.id].cleanliness = true;
            localStorage.setItem('loocator_voted', JSON.stringify(voted));

            if (!globalRatingsDb[payload.id]) globalRatingsDb[payload.id] = { usable_yes: 0, usable_no: 0, cleanliness_sum: 0, cleanliness_count: 0 };
            if (payload.usable === 'yes') globalRatingsDb[payload.id].usable_yes += 1;
            if (payload.usable === 'no') globalRatingsDb[payload.id].usable_no += 1;

            showToast(t('voteThanks'), 'success');
            loadRatings(payload.id);
            checkVotedStatus(payload.id);
            renderMarkers();
        } catch(e) {
            customAlert(t('alertError'));
        }
    }

    document.getElementById('btn-usable-yes').addEventListener('click', () => sendVote({usable: 'yes'}));
    document.getElementById('btn-usable-no').addEventListener('click', () => sendVote({usable: 'no'}));
    
    document.querySelectorAll('.btn-star').forEach(starBtn => {
        starBtn.addEventListener('click', (e) => {
            const val = parseInt(e.target.getAttribute('data-val'));
            sendVote({cleanliness: val});
        });
    });

    function checkVotedStatus(osmId) {
        const voted = JSON.parse(localStorage.getItem('loocator_voted') || '{}');
        const thisVote = voted[osmId] || {};
        
        const btnYes = document.getElementById('btn-usable-yes');
        const btnNo = document.getElementById('btn-usable-no');
        const starDiv = document.getElementById('star-rating');

        if(thisVote.usable) {
            btnYes.disabled = true; btnYes.classList.add('opacity-50');
            btnNo.disabled = true; btnNo.classList.add('opacity-50');
        } else {
            btnYes.disabled = false; btnYes.classList.remove('opacity-50');
            btnNo.disabled = false; btnNo.classList.remove('opacity-50');
        }

        if(thisVote.cleanliness) {
            starDiv.classList.add('opacity-50', 'pointer-events-none');
        } else {
            starDiv.classList.remove('opacity-50', 'pointer-events-none');
        }
    }

    fetchToilets();
});