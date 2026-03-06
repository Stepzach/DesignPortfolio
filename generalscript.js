    document.addEventListener('DOMContentLoaded', () => {
        
        // --- 1. PLAYER & UI LOGIC (SYNCED) ---
        const radioPlayer = document.getElementById('radio-player'); 
        const bars = document.querySelectorAll('.bar');

        function updatePlayButtons(isPlaying) {
            const allPlayIcons = document.querySelectorAll('.play-toggle i, .play-toggle-main i');
            
            allPlayIcons.forEach(icon => {
                if (isPlaying) {
                    icon.classList.replace('fa-play', 'fa-pause');
                } else {
                    icon.classList.replace('fa-pause', 'fa-play');
                }
            });

            bars.forEach(bar => {
                bar.style.animationPlayState = isPlaying ? 'running' : 'paused';
            });
        }

        // Initialize state
        bars.forEach(bar => bar.style.animationPlayState = 'paused');
        
        function togglePlay() {
            if (radioPlayer.paused) {
                radioPlayer.play();
                updatePlayButtons(true);
            } else {
                radioPlayer.pause();
                updatePlayButtons(false);
            }
        }

        document.body.addEventListener('click', function(e) {
            const btn = e.target.closest('.play-toggle, .play-toggle-main');
            if (btn) {
                togglePlay();
            }
        });

        // --- 2. MOBILE MENU LOGIC ---
        const mobileBtn = document.querySelector('.mobile-toggle');
        const navMenu = document.querySelector('.nav-menu');
        const navIcon = mobileBtn.querySelector('i');
        const overlay = document.querySelector('.mobile-overlay');

        function toggleMenu() {
            const isActive = navMenu.classList.toggle('active');
            overlay.classList.toggle('active');
            
            if (isActive) {
                navIcon.classList.replace('fa-bars', 'fa-times');
            } else {
                navIcon.classList.replace('fa-times', 'fa-bars');
            }
        }

        if (mobileBtn) mobileBtn.addEventListener('click', toggleMenu);
        if (overlay) overlay.addEventListener('click', () => {
            if (navMenu.classList.contains('active')) toggleMenu();
        });

        // --- 3. CSV PARSER ---
        function parseCSV(str) {
            const arr = [];
            let quote = false;  
            let row = 0, col = 0;
            for (let c = 0; c < str.length; c++) {
                let cc = str[c], nc = str[c+1];
                arr[row] = arr[row] || [];
                arr[row][col] = arr[row][col] || '';
                if (cc == '"' && quote && nc == '"') { arr[row][col] += cc; ++c; continue; }
                if (cc == '"') { quote = !quote; continue; }
                if (cc == ',' && !quote) { ++col; continue; }
                if (cc == '\r' && nc == '\n' && !quote) { ++row; col = 0; ++c; continue; }
                if (cc == '\n' && !quote) { ++row; col = 0; continue; }
                if (cc == '\r' && !quote) { ++row; col = 0; continue; }
                arr[row][col] += cc;
            }
            return arr;
        }

        // --- 4. COMMITTEE LOGIC (WITH MODAL SUPPORT) ---
        const committeeSheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRoXcefXiUOFuRnA6DpheBwR2CJ4Zs09o68IG9in3w2WwncXybxsbVDWwQY6u6MSpmFDiRrx83MO8M3/pub?gid=2123499295&output=csv';

        async function fetchCommitteeData() {
            const grid = document.getElementById('committee-grid-container');
            if (!grid) return; 

            try {
                const response = await fetch(committeeSheetUrl);
                const data = await response.text();
                const rows = parseCSV(data);
                rows.shift(); 
                grid.innerHTML = ''; 

                rows.forEach(row => {
                    if (!row || !row[1] || row[1].trim() === '') return; 
                    const name = row[1].trim();
                    const role = row[2] ? row[2].trim() : 'Committee Member'; 
                    const imgLink = row[3] ? row[3].trim() : 'https://via.placeholder.com/300x300?text=No+Image';

                    const card = document.createElement('div');
                    card.className = 'committee-card';
                    card.innerHTML = `
                        <img src="${imgLink}" alt="${name}">
                        <div class="committee-info">
                            <h3 class="committee-name">${name}</h3>
                            <p class="committee-role">${role}</p>
                        </div>
                    `;
                    // Restoration of the modal click event from script 1
                    card.addEventListener('click', () => {
                        if (typeof openModal === "function") openModal(name, role, imgLink);
                    });
                    grid.appendChild(card);
                });
            } catch (error) {
                console.error("Failed to fetch committee data", error);
            }
        }

        // --- 5. GET INVOLVED LOGIC (WITH SMART FOOTERS) ---
        const applySheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRoXcefXiUOFuRnA6DpheBwR2CJ4Zs09o68IG9in3w2WwncXybxsbVDWwQY6u6MSpmFDiRrx83MO8M3/pub?gid=2045188384&output=csv';

        async function fetchApplyData() {
            const grid = document.getElementById('apply-grid');
            if (!grid) return; 

            try {
                const response = await fetch(applySheetUrl);
                const data = await response.text();
                const rows = parseCSV(data);
                rows.shift(); 
                grid.innerHTML = ''; 
                
                const categoriesMap = {};
                rows.forEach(row => {
                    if (!row || row.length < 3 || !row[1] || row[1].trim() === '') return; 
                    const category = row[1].trim();
                    const showName = row[2] ? row[2].trim() : '';
                    const formLink = row[3] ? row[3].trim() : '#';
                    if (!categoriesMap[category]) categoriesMap[category] = [];
                    categoriesMap[category].push({ showName, formLink });
                });

                for (const [category, shows] of Object.entries(categoriesMap)) {
                    const box = document.createElement('div');
                    box.className = 'apply-box';
                    box.innerHTML = `<h3>${category}</h3>`;
                    
                    const showsContainer = document.createElement('div');
                    showsContainer.className = 'shows-container';
                    shows.forEach(show => {
                        const link = document.createElement('a');
                        link.className = 'show-link';
                        link.href = show.formLink;
                        link.target = '_blank';
                        link.innerText = `> ${show.showName}`;
                        showsContainer.appendChild(link);
                    });
                    box.appendChild(showsContainer);

                    // Restoration of the specific footer text logic from script 1
                    let footerText = `*Find out more about ${category} on our Instagram @thisislsr`;
                    const catLower = category.toLowerCase();
                    if (catLower.includes('weekend')) footerText = '*Learn more about our weekend shows over at @thisislsr_weekend';
                    else if (catLower.includes('daytime')) footerText = '*Find out more about any of LSR\'s daytime shows over on insta @thisislsr_daytime';
                    else if (catLower.includes('news')) footerText = '*Find out more about LSR\'s news team head on our dedicated news insta @thisislsr_news';
                    else if (catLower.includes('sports')) footerText = '*Got questions about our sports team? Head on over to insta @thisislsr_sport';
                    else if (catLower.includes('breakfast') || catLower.includes('hometime')) footerText = '*Find out more about Breakfast or Hometime on Instagram @thisislsr_breakfast @thisislsr_hometime';
                    else if (catLower.includes('podcast') || catLower.includes('own show')) footerText = 'Our schedule ranges from arts, comedy and music to sport, film and politics so no matter what you\'re interested in, we\'ll help you get it on-air!';

                    const footer = document.createElement('p');
                    footer.className = 'box-footer';
                    footer.innerText = footerText;
                    box.appendChild(footer);
                    grid.appendChild(box);
                }
            } catch (error) {
                console.error("Failed to fetch apply forms", error);
            }
        }

        // --- 6. SCHEDULE & MEDIASESSION LOGIC ---
        const scheduleSheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRoXcefXiUOFuRnA6DpheBwR2CJ4Zs09o68IG9in3w2WwncXybxsbVDWwQY6u6MSpmFDiRrx83MO8M3/pub?output=csv&gid=0';

        function timeToMinutes(timeStr) {
            if (!timeStr) return -1;
            const parts = timeStr.split(':').map(n => parseInt(n, 10));
            if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return -1;
            return parts[0] * 60 + parts[1];
        }

        function updateMediaSession(show) {
            if ('mediaSession' in navigator) {
                const title = show?.title || "LSR Non-Stop";
                const artist = show?.host || "Leeds Student Radio";
                const artworkUrl = show?.image || "https://github.com/Leeds-student-radio/Lsr/blob/main/316c00_e270ed388b21449d9bdd56622dbeb4ec~mv2.jpg.webp?raw=true";

                navigator.mediaSession.metadata = new MediaMetadata({
                    title: title,
                    artist: artist,
                    artwork: [
                        { src: artworkUrl, sizes: '512x512', type: 'image/jpeg' }
                    ]
                });
            }
        }

        async function fetchScheduleData() {
            try {
                const response = await fetch(scheduleSheetUrl);
                const data = await response.text();
                const rows = parseCSV(data);
                rows.shift(); 
                
                const now = new Date();
                const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                const currentDay = days[now.getDay()];
                const currentMinutes = now.getHours() * 60 + now.getMinutes();
                const currentWeekType = 'B'; // Toggle this manually as needed
                
                let liveShow = null;
                let nextShow = null;
                
                const todayShows = rows.filter(row => {
                    if(row.length < 8) return false;
                    const day = row[4]?.trim() || '';
                    const week = row[5]?.trim() || '';
                    return day.toLowerCase() === currentDay.toLowerCase() && week.toUpperCase().includes(currentWeekType);
                });

                const parsedShows = todayShows.map(row => ({
                    title: row[1] || "LSR Show",
                    description: row[2] || "Non-stop student radio.",
                    image: row[3] || "https://github.com/Leeds-student-radio/Lsr/blob/main/316c00_e270ed388b21449d9bdd56622dbeb4ec~mv2.jpg.webp?raw=true",
                    start: timeToMinutes(row[6]),
                    end: timeToMinutes(row[7]),
                    rawStart: row[6],
                    rawEnd: row[7],
                    host: row[8] || "LSR Presenter"
                })).filter(s => s.start !== -1).sort((a, b) => a.start - b.start);

                for (let i = 0; i < parsedShows.length; i++) {
                    const show = parsedShows[i];
                    const isLive = (show.start <= show.end) 
                        ? (currentMinutes >= show.start && currentMinutes < show.end)
                        : (currentMinutes >= show.start || currentMinutes < show.end);

                    if (isLive) {
                        liveShow = show;
                        nextShow = parsedShows[i + 1] || null;
                        break;
                    } else if (show.start > currentMinutes && !liveShow) {
                        nextShow = show;
                        break;
                    }
                }

                // Update Footer
                if (liveShow) {
                    document.getElementById('live-now-title').innerText = liveShow.title;
                    document.getElementById('live-now-img').src = liveShow.image;
                    document.getElementById('live-now-desc').innerText = liveShow.description;
                    updateMediaSession(liveShow);
                }

                // Update Main Player (Home page only)
                const mainTitle = document.getElementById('main-player-title');
                if (mainTitle && liveShow) {
                    mainTitle.innerText = liveShow.title;
                    document.getElementById('main-player-host').innerText = "with " + liveShow.host;
                    document.getElementById('main-player-desc').innerText = liveShow.description;
                    document.getElementById('main-player-img').src = liveShow.image;
                    document.getElementById('main-player-time').innerText = `LIVE NOW (${liveShow.rawStart} - ${liveShow.rawEnd})`;
                }

                if (nextShow) {
                    const nextT = document.getElementById('up-next-title');
                    if(nextT) nextT.innerText = nextShow.title;
                    const nextI = document.getElementById('up-next-img');
                    if(nextI) nextI.src = nextShow.image;
                }
            } catch (error) {
                console.error("Schedule fetch error", error);
            }
        }

       // --- 7. ROUTING & INIT ---
async function loadPage(url) {
    try {
        const response = await fetch(url);
        const htmlString = await response.text();
        const parser = new DOMParser();
        const newDoc = parser.parseFromString(htmlString, "text/html");
        const newMain = newDoc.querySelector('main');
        const currentMain = document.querySelector('main');
        
        if (newMain && currentMain) {
            currentMain.innerHTML = newMain.innerHTML;
            document.title = newDoc.title;
            if (navMenu.classList.contains('active')) toggleMenu();

            // Trigger data fetches based on the new URL
            if (url.includes('involved')) fetchApplyData();
            if (url.includes('about')) fetchCommitteeData();
            
            // Add this line for your schedule/listen page
            if (url.includes('listen') || url.includes('schedule')) fetchScheduleData();

            // Always run this to ensure the footer player stays synced
            fetchScheduleData(); 
        }
    } catch (e) { 
        window.location.assign(url); 
    }
}

        document.body.addEventListener('click', e => {
            const link = e.target.closest('a');
            if (link && link.origin === window.location.origin && link.target !== '_blank') {
                e.preventDefault();
                window.history.pushState({}, "", link.href);
                loadPage(link.href);
            }
        });

        window.addEventListener('popstate', () => loadPage(window.location.href));

        // Start everything
        fetchScheduleData();
        fetchCommitteeData();
        fetchApplyData();
        setInterval(fetchScheduleData, 180000);
    });
