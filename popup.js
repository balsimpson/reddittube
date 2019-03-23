let category = 'videos';
let timeperiod = 'week';

let recommended_subreddits = [
	'fullcartoonsonyoutube',
	'policechases',
]

const LOADING_HTML = `
<div class="lds-ellipsis">
	<div></div>
	<div></div>
	<div></div>
	<div></div>
</div>`;

// Global variable to save userData
let userData = {};

// Global Variable to save current playlist
let currentPlaylist = [];
// Video Ids of watched videos
let watchedList = [];

window.onload = () => {
	// loads the IFrame Player API code asynchronously
	let tag = document.createElement('script');
	tag.src = "https://www.youtube.com/iframe_api";
	let firstScriptTag = document.getElementsByTagName('script')[0];
	firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
};

// Create YouTube Player
let player;
function onYouTubeIframeAPIReady() {
	player = new YT.Player('player', {
		height: '390',
		width: '640',
		playerVars: {
			'autoplay': 1,
			'controls': 1,
			// 'enablejsapi': 1,
			'modestbranding': 1
		},
		// autoplay: 1,
		events: {
			'onReady': getUserFavourites,
			'onStateChange': onPlayerStateChange
		}
	});
}

function onPlayerStateChange(event) {
	let player_state = event.data;

	let playlist = event.target.getPlaylist();
	let index = event.target.getPlaylistIndex();
	console.log(playlist, index);

	// let video_id = 
	if (player_state === 0) {
		console.log('ended playing ', index - 1);

		if (playlist[index - 1]) {
			userData.watched_list.push(playlist[index - 1]);
			// Save to storage
			updateUserData();
		}
	}
	if (player_state === -1) {
		console.log('unstarted');
	}
	if (player_state === 1) {
		console.log('playing ' + index++);
	}
	if (player_state === 2) {
		console.log('playing ' + index++);
	}
	if (player_state === 3) {
		console.log('next ' + index);
		if (playlist[index - 1]) {
			userData.watched_list.push(playlist[index - 1]);
			// Save to storage
			updateUserData();
		}
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

const getReddit = async () => {

	try {
		let category = userData.channels[userData.current].join('+');
		let timeperiod = userData.sort;
		let url = `https://www.reddit.com/r/${category}/top.json?t=${timeperiod.toLowerCase()}`;
		console.log(`Getting Posts from: ${JSON.stringify(url, null, 2)}`);

		let feed = await xhttpCall('GET', url);
		let video_ids = getVideoIDs(JSON.parse(feed.responseText));
		getUnwatched(video_ids, loadPLayer);

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

// Show Menu options
const menuOptions = async (categories) => {
	console.log('category', categories);
	let menuDiv = document.querySelector('.dropdown-menu-content');

	for (const category in categories) {

		let catDiv = document.createElement('div');
		catDiv.className = 'menu-category';

		// Header
		let catHeader = document.createElement('div');
		catHeader.className = 'cat-header';
		let catTitle = document.createElement('div');
		catTitle.className = 'cat-title';
		catTitle.id = category;
		catTitle.innerText = category;

		let addButton = document.createElement('div');
		addButton.className = 'add-subreddit';
		// addButton.innerText = 'ADD SUBREDDIT';
		let inputTxt = document.createElement('input');
		inputTxt.className = 'input-txt';
		inputTxt.placeholder = 'Add a subreddit';
		let plusBtn = document.createElement('span');
		plusBtn.className = 'btn-plus';
		plusBtn.innerHTML = '<i class="fas fa-plus">';
		addButton.appendChild(inputTxt);
		addButton.appendChild(plusBtn);

		catHeader.appendChild(catTitle);
		catHeader.appendChild(addButton);
		// catHeader.appendChild(inputTxt);
		// catHeader.appendChild(plusBtn);

		let catSubreddits = document.createElement('ul');
		catSubreddits.className = 'tags';

		categories[category].map(cat => {
			let catSubreddit = document.createElement('li');
			catSubreddit.className = 'tag';
			catSubreddit.innerHTML = cat;

			let deleteBtn = document.createElement('span');
			deleteBtn.className = 'close';
			deleteBtn.setAttribute("aria-label", "Close");
			deleteBtn.innerHTML = '&times;';
			catSubreddit.appendChild(deleteBtn);

			deleteBtn.addEventListener('click', e => {
				console.log('delete subreddit', e.target.offsetParent.textContent);
			})
			catSubreddits.appendChild(catSubreddit);
		});

		catDiv.appendChild(catHeader);
		catDiv.appendChild(catSubreddits);

		menuDiv.appendChild(catDiv)
		console.log('category', category);

		// Rename channels
		catTitle.addEventListener("dblclick", e => {
			console.log('double-clicked');
			catTitle.contentEditable = true;
			catTitle.focus();

			catTitle.addEventListener("focusout", e => {
				catTitle.contentEditable = false;
				catTitle.innerText.trim();

				let renamed = catTitle.innerText.trim();

				userData.channels[renamed] = userData.channels[catTitle.id];
				delete userData.channels[catTitle.id];
				
				updateUserData();
				console.log(userData.channels);
			});
		});

		// Add Subreddit Button
		addButton.addEventListener('click', e => {
			console.log('clicked');
			plusBtn.innerHTML = "display:block";
		})

		// Add Subreddit Plus Button
		plusBtn.addEventListener('click', e => {
			console.log('check subreddit', inputTxt.value);
			let resp = checkSubreddit(inputTxt.value);
			resp.then(data => {
				console.log('response', data);

			})
		})

		// Delete Subreddit Button
		// document.querySelectorAll('.close').forEach(btn => {
		// 	btn.addEventListener('click', e => {
		// 		console.log('delete subreddit', e);
		// 	})
		// })
	}
}

// Time Period
document.querySelector('.timeperiod').addEventListener('click', e => {
	let sort = e.target.innerText.toLowerCase().substr(0, 2);
	let _sort = userData.sort.toLowerCase().substr(0, 2);

	let timeperiod = '';

	if (sort !== _sort) {
		switch (sort) {
			case 'da':
				timeperiod = 'day';
				break;
			case 'we':
				timeperiod = 'week';
				break;
			case 'mo':
				timeperiod = 'month';
				break;
			case 'ye':
				timeperiod = 'year';
				break;
			case 'al':
				timeperiod = 'all';
				break;
		}

		userData.sort = timeperiod;
		console.log('getting data from reddit', timeperiod);
		renderSort(timeperiod);
		updateUserData();
		getReddit();
	}
})

// get an array of video ids
const getVideoIDs = (response) => {
	try {
		let feed = response.data.children;
		let video_ids = [];
		for (let i = 0; i < feed.length; i++) {
			if (feed[i].data.domain == 'youtube.com' || feed[i].data.domain == 'youtu.be') {
				let id = YouTubeGetID(feed[i].data.url);
				let title = YouTubeGetID(feed[i].data.title);
				video_ids.push({
					title: title,
					id: id
				});
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

// Check subreddit
const checkSubreddit = async (subreddit) => {

	try {
		let url = `https://www.reddit.com/r/${subreddit}/top.json?t=week`;
		let results = await xhttpCall('GET', url);
		let video_ids = getVideoIDs(JSON.parse(results.responseText));

		if (video_ids.length > 5) {
			console.log('results', video_ids.length);
			return video_ids;
		} else {
			console.log('not enough results');
		}
	} catch (error) {
		return error;
	}
}

// Remove watched videos
const getUnwatched = (videos, callback) => {

	let unWatchedList = [];
	let watchedStatus = false;

	// Get watchedList
	console.log('Watched List is ' + JSON.stringify(userData.watched_list));
	let watchedList = userData.watched_list;

	for (const key in videos) {
		let id = videos[key].id;
		watchedStatus = watchedList.includes(id);

		if (!watchedStatus) {
			unWatchedList.push(id);
		}
	}

	callback(unWatchedList);
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

	if (txt) {
		let categories = txt.split('+');

		let parentDiv = document.querySelector('.video');
		parentDiv.innerHTML = LOADING_HTML;

		let load_txt = document.createElement('div');
		load_txt.classList.add('loading');

		// SORT TEXT
		let sort = userData.sort.toUpperCase();
		let sort_html = '';

		if (sort === 'ALL') {
			sort_html = '<span class="sort">TOP VIDEOS OF ALL TIME</span>';
		} else {
			sort_html = `<span class="sort">TOP VIDEOS OF THE ${sort}</span>`;
		}

		load_txt.innerHTML = `<span class="light-gray">LOADING ${sort_html} FROM </span>`;

		let subreddits = userData.channels[userData.current].join(', ');
		load_txt.innerHTML += subreddits.toUpperCase() + '';

		parentDiv.appendChild(load_txt);
	} else {
		let load_txt = document.createElement('div');
		load_txt.classList.add('loading');
		let parentDiv = document.querySelector('.video');
		parentDiv.innerHTML = LOADING_HTML;
		parentDiv.appendChild(load_txt);
	}

}

const getUserData = async () => {
	chrome.storage.local.get(['userData'], (result) => {
		console.log('Got UserData: ', result.userData);
		// Save to global variable
		userData = result.userData;
		return result.userData;
	})
}

const updateUserData = () => {
	chrome.storage.local.set({ userData: userData }, (result) => {
		console.log('Set UserData: ', userData);
		// return result;
	});
}

// Get User Favourites
const getUserFavourites = async () => {
	// showLoading();
	// Get user data from local storage
	chrome.storage.local.get(['userData'], (result) => {
		console.log('Got UserData: ', result.userData);
		// Save to global variable
		userData = result.userData;
		// showLoading(userData.channels[userData.current].join('+'));
		renderCategories(userData.channels);
		// timeperiod
		renderSort(userData.sort);
		menuOptions(userData.channels);
		getReddit(userData.current, userData.sort);
	})
}

const renderCategories = (channels) => {
	let cat_container = document.querySelector('.categories');
	for (category in channels) {
		let cat_btn = document.createElement('div');
		let subreddits = channels[category].join('+');
		cat_btn.setAttribute('data-subreddit', subreddits);
		cat_btn.setAttribute('class', 'button-lg');
		cat_btn.setAttribute('id', category);
		cat_btn.innerText = category;

		cat_btn.addEventListener('click', e => {
			console.log(e);
			removeClass('.button-lg', 'selected');

			let category = e.target.dataset.subreddit;
			e.target.classList.add('selected');

			// show loading
			showLoading(category);

			userData.current = e.target.id;
			updateUserData(userData);
			getReddit(category);
			// e.target.parentNode.classList.add("selected");
		})
		cat_container.appendChild(cat_btn);
	}
	document.getElementById(userData.current).classList.add('selected');
}

const renderSort = (timeperiod) => {
	let sort = document.querySelector('#timeperiod');

	if (timeperiod === 'day') {
		timeperiod = 'daily'
	}
	if (timeperiod === 'week') {
		timeperiod = 'weekly'
	}
	if (timeperiod === 'month') {
		timeperiod = 'monthly'
	}
	if (timeperiod === 'year') {
		timeperiod = 'yearly'
	}
	if (timeperiod === 'all') {
		timeperiod = 'all time'
	}

	sort.innerText = timeperiod.toUpperCase();
}