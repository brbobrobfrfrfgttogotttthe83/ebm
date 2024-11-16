const video = document.getElementById('video');
const videoTitle = document.getElementById('videoTitle');
const categorySelect = document.getElementById('categorySelect');
const videoList = document.getElementById('videoList');
const searchInput = document.getElementById('searchInput');

let videosByCategory = {};
let allVideosWithMetadata = [];

function loadM3U8() {
    fetch('playlist.m3u8')
        .then(response => response.text())
        .then(data => {
            videosByCategory = parseM3U8(data);
            createAllVideosList();
            populateCategories(videosByCategory);
        })
        .catch(error => console.error("Error loading M3U8 file:", error));
}

function parseM3U8(data) {
    const lines = data.split('\n');
    const videosByCategory = {};
    let currentCategory = null;
    let currentIndex = 1;

    lines.forEach((line, index) => {
        if (line.startsWith('# Category:')) {
            currentCategory = line.replace('# Category:', '').trim();
            videosByCategory[currentCategory] = [];
            currentIndex = 1;
        }
        if (line.startsWith('https://') && currentCategory) {
            const titleLine = lines[index - 1];
            const videoTitleText = titleLine.replace('# ', '').trim();
            videosByCategory[currentCategory].push({
                title: videoTitleText,
                url: line.trim(),
                category: currentCategory,
                originalIndex: currentIndex++
            });
        }
    });

    return videosByCategory;
}

function createAllVideosList() {
    allVideosWithMetadata = [];
    for (const category in videosByCategory) {
        allVideosWithMetadata = allVideosWithMetadata.concat(videosByCategory[category]);
    }
}

function populateCategories(videosByCategory) {
    const allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.textContent = 'Tutte le categorie';
    categorySelect.appendChild(allOption);

    for (const category in videosByCategory) {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    }

    categorySelect.value = 'all';
    loadVideos('all');
}

function loadVideos(categoryValue) {
    const searchTerm = searchInput.value.toLowerCase();
    let videosToShow;

    if (categoryValue === 'all') {
        videosToShow = allVideosWithMetadata;
    } else {
        videosToShow = videosByCategory[categoryValue];
    }

    if (searchTerm) {
        videosToShow = videosToShow.filter(video => 
            video.title.toLowerCase().includes(searchTerm)
        );
    }

    displayVideos(videosToShow);
}

function displayVideos(videos) {
    videoList.innerHTML = '';
    videos.forEach((videoItem) => {
        const li = document.createElement('li');
        li.textContent = `${videoItem.originalIndex}. ${videoItem.title}`;
        if (categorySelect.value === 'all') {
            li.textContent += ` [${videoItem.category}]`;
        }
        li.addEventListener('click', () => {
            loadVideo(videoItem.title, videoItem.url);
        });
        videoList.appendChild(li);
    });
}

function loadVideo(title, url) {
    videoTitle.textContent = title;
    video.src = url;

    if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, function (event, data) {
            console.log("Manifest loaded, starting playback...");
        });

        hls.on(Hls.Events.ERROR, function (event, data) {
            if (data.fatal) {
                console.error("Error:", data);
                alert("Error loading the video stream.");
            }
        });
    } else {
        alert("HLS.js is not supported in this browser. Please use a compatible browser.");
    }
}

categorySelect.addEventListener('change', () => {
    loadVideos(categorySelect.value);
});

searchInput.addEventListener('input', () => {
    loadVideos(categorySelect.value);
});

window.onload = loadM3U8;