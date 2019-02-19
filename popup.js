let category = 'videos';
let timeperiod = 'week';

let recommended_subreddits = [
	'fullcartoonsonyoutube',
	'policechases',
]

let user_data = {
	favourites: {
		Videos: ['videos', 'storytellingvideos', 'Best_Of_YouTube'],
		Art: ['artdocumentaries'],
		Mealtime: ['mealtimevideos'],
		Useful: ['usefulvids', 'EducativeVideos', 'spacevideos'],
		Trailers: ['trailers', 'CultTrailers', 'CampCult'],
		Music: ['listentothis', 'MusicVideosOnYouTube', 'fullconcertonyoutube', 'FullAlbumsOnYouTube'],
		Movies: ['fullmoviesonyoutube', 'FullWesternsOnYoutube'],
		Obscure: ['unknownvideos', 'NotTimAndEric', 'youtubehaiku', 'DeepIntoYouTube', 'InterdimensionalCable', 'CommercialCuts', 'AwfulCommercials', 'ObscureMedia']
	},
	current: 'Videos',
	sort: timeperiod
}

const LOADING_HTML = `
<div class="lds-ellipsis">
	<div></div>
	<div></div>
	<div></div>
	<div></div>
</div>`;

// Global Variable to save current playlist
let currentPlaylist = [];
// Video Ids of watched videos
let watchedList = [];

// loads the IFrame Player API code asynchronously
let tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
let firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// Create YouTube Player
let player;
function onYouTubeIframeAPIReady() {
	player = new YT.Player('player', {
		height: '390',
		width: '640',
		autoplay: 1,
		events: {
			'onReady': getUserFavourites,
			'onStateChange': onPlayerStateChange
		}
	});
}

// Load Playlist when Player is ready
// function onPlayerReady(event) {

// }

// Player Status Change
/*
-1 – unstarted
0 – ended
1 – playing
2 – paused
3 – buffering
5 – video cued

YT.PlayerState.ENDED
YT.PlayerState.PLAYING
YT.PlayerState.PAUSED
YT.PlayerState.BUFFERING
YT.PlayerState.CUED

*/
function onPlayerStateChange(event) {
	let player_state = event.data;
	let index = event.target.getPlaylistIndex();

	if (player_state === 0) {
		console.log('ended playing ', index-1);
		watchedList.push(currentPlaylist[index-1]);
		// Save to storage
		chrome.storage.sync.set({ watchedList: watchedList }, (result) => {
			console.log('Saved Watched List: ' + watchedList);
		});
	}
	if (player_state === -1) {
		console.log('unstarted');
	}
	if (player_state === 1) {
		console.log('playing ' + index++);
	}
	if (player_state === 5) {
		console.log('cued');
	}
}
// Stop Video
function stopVideo() {
	player.stopVideo();
}

const videoContainer = document.querySelector('.video');

const xhttpCall = (method, url) => {
	return new Promise(function (resolve, reject) {
		const xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function () {
			if (this.readyState == 4 && this.status == 200) {
				// console.log(`this.responseText: ${JSON.stringify(this.responseText, null, 2)}`);
				return resolve(this);
			}
		};

		xhttp.open(method, url, true);
		xhttp.send();
	});
}

const getReddit = async (_category, _timeperiod) => {

	try {
		if (_category) {
			category = _category;
			// turn off all selection
		}

		if (_timeperiod) {
			timeperiod = _timeperiod;
		}

		let url = `https://www.reddit.com/r/${category}/top.json?t=${timeperiod.toLowerCase()}`;
		console.log(`Getting Posts from: ${JSON.stringify(url, null, 2)}`);

		let feed = xhttpCall('GET', url);

		feed.then(data => {
			let video_ids = getVideoIDs(JSON.parse(data.responseText));
			getUnwatched(video_ids, loadPLayer);
		});
	} catch (error) {
		console.log(error);
	}
}

// load player
function loadPLayer(playlist) {
	currentPlaylist = playlist;
	console.log('currentPlaylist', playlist);
	player.loadPlaylist(playlist);
}

// Get Rumina Instagram Count
const getFollowerCount = () => {
	let count_url = `https://numerous-mosquito-9311.dataplicity.io/nodered/rumina`;

	let count = xhttpCall('GET', count_url);
	count.then(data => {
		console.log(data.responseText);
		chrome.browserAction.setBadgeText({ text: data.responseText });
	})
}

// Time Period
document.querySelectorAll('.btn-sort').forEach(btn => {
	btn.addEventListener('click', e => {
		console.log(e);
		// Update UserData
		user_data.sort = e.target.id;
		updateUserData(user_data);

		// show loading
		let subreddit_list = user_data.favourites[user_data.current].join('+');
		showLoading(subreddit_list);
		removeClass('.btn-sort', 'selected');

		let timeperiod = e.target.innerText;
		getReddit('', timeperiod);
		e.target.classList.add('selected');
	})
})
// get an array of video ids
const getVideoIDs = (response) => {
	try {
		let feed = response.data.children;
		let video_ids = [];
		for (let i = 0; i < feed.length; i++) {
			if (feed[i].data.domain == 'youtube.com' || feed[i].data.domain == 'youtu.be') {
				let id = YouTubeGetID(feed[i].data.url);
				video_ids.push(id);
			}
		}
		return video_ids;
	} catch (error) {
		return error;
	}

	function YouTubeGetID(url) {
		url = url.split(/(vi\/|v%3D|v=|\/v\/|youtu\.be\/|\/embed\/)/);
		return undefined !== url[2] ? url[2].split(/[^0-9a-z_\-]/i)[0] : url[0];
	}
}

// Remove watched videos
const getUnwatched = (videoIDs, callback) => {

	let unWatchedList = [];
	let watchedStatus = false;

	// Get watchedList
	chrome.storage.sync.get(['watchedList'], (result) => {
		console.log('Watched List result: ' + JSON.stringify(result));
		if (result && result.watchedList.length) {
			watchedList = result.watchedList;
			console.log('Watched List is ' + JSON.stringify(result.watchedList));
		} else {
			console.log('No watched List');
		}

		for (const key in videoIDs) {
			let id = videoIDs[key];
			watchedStatus = watchedList.includes(id);

			if (!watchedStatus) {
				unWatchedList.push(id);
			}
		}

		console.log('watchedList: ', watchedList);
		// Set watchedList
		chrome.storage.sync.set({ watchedList: watchedList }, (result) => {
			console.log('Saved Watched List: ' + result);
		});

		console.log('unWatchedList: ', unWatchedList);
		callback(unWatchedList);
	});
}

function removeClass(btnClass, classToRemove) {
	document.querySelectorAll(btnClass).forEach(btn => {
		btn.classList.remove(classToRemove);
		// console.log('btn', btn);
	});
}

function addClass(btnId, classToAdd) {
	document.querySelector(btnId).classList.add(classToAdd);
}

function showLoading(txt) {
	let categories = txt.split('+');

	let parentDiv = document.querySelector('.video');
	parentDiv.innerHTML = LOADING_HTML;

	let load_txt = document.createElement('div');
	load_txt.classList.add('loading');

	// SORT TEXT
	let sort = user_data.sort.toUpperCase();
	let sort_html = '';

	if (sort === 'ALL') {
		sort_html = '<span class="sort">TOP VIDEOS OF ALL TIME</span>';
	} else {
		sort_html = `<span class="sort">TOP VIDEOS OF THE ${sort}</span>`;
	}

	load_txt.innerHTML = `<span class="light-gray">LOADING ${sort_html} FROM </span>`;

	let subreddits = categories.join(', ');
	load_txt.innerHTML += subreddits.toUpperCase() + '';

	parentDiv.appendChild(load_txt);
}

// Get User Favourites
const getUserFavourites = () => {
	chrome.storage.sync.get(['userData'], (result) => {
		// console.log('UserData: ' + JSON.stringify(result.userData));
		if (result.userData) {
			showLoading(result.userData.favourites[result.userData.current].join('+'));
			renderCategories(result.userData);
			let currentCategory = result.userData.favourites[result.userData.current].join('+');

			console.log('Now Playing: ' + JSON.stringify(result.userData.current));
			document.getElementById(result.userData.current).classList.add('selected');
			document.getElementById(result.userData.sort).classList.add('selected');

			user_data = result.userData;
			updateUserData(user_data);
			getReddit(currentCategory, result.userData.sort);
		} else {
			console.log('No UserData');
			let currentCategory = user_data.favourites[user_data.current].join('+');
			getReddit(currentCategory, user_data.sort);
			renderCategories(user_data);
			document.getElementById(user_data.current).classList.add('selected');
			document.getElementById(user_data.sort).classList.add('selected');
			updateUserData(user_data);
		}
	});
}

const updateUserData = (data) => {
	chrome.storage.sync.set({ userData: data }, function () {
		console.log('Set UserData: ');
		user_data = data;
	});
}

const renderSort = (id) => {
	document.getElementById(id).classList.add('selected');
}

const renderCategories = (data) => {
	let cat_container = document.querySelector('.categories');

	let favourites = data.favourites;
	for (category in favourites) {
		let cat_btn = document.createElement('div');
		let subreddits = favourites[category].join('+');
		cat_btn.setAttribute('data-subreddit', subreddits);
		cat_btn.setAttribute('class', 'button-lg');
		cat_btn.setAttribute('id', category);
		cat_btn.innerText = category;

		cat_btn.addEventListener('click', e => {
			console.log(e);
			removeClass('.button-lg', 'selected');
			// make this button selected
			e.target.classList.add("selected");

			let category = e.target.dataset.subreddit;
			e.target.classList.add('selected');

			// show loading
			showLoading(category);

			user_data.current = e.target.id;
			updateUserData(user_data);
			getReddit(category);
			// e.target.parentNode.classList.add("selected");
		})

		cat_container.appendChild(cat_btn);
	}
}

// getReddit('videos');
// addClass('#videos', "selected");
// const mainProgram = () => {
	// Get VideoIDs
	// getUserFavourites();

	// Show only unwatched

	/*
	
	get video ids from reddit
	
	
	check with watchedlist array
	
	
	create playlist of unwatched
	
	
	when finished playing, add to watchedlist
	
	
	cleanup db every month end
	
	*/
// }

// getFollowerCount();