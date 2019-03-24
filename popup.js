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
// Global Variable to save current playlist info
let currentPlaylistInfo = [];
// Video Ids of watched videos
let watchedList = [];
// Should console log?
let shouldLog = true;

window.onload = () => {
	// loads the IFrame Player API code asynchronously
	let tag = document.createElement('script');
	tag.src = "https://www.youtube.com/iframe_api";
	let firstScriptTag = document.getElementsByTagName('script')[0];
	firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

	// showToast('this is some message', 'success');
};

// Console logger
const log = (label, data) => {
	if (shouldLog) {
		console.log(label, data);
	}
}

// Create YouTube Player
let player;
function onYouTubeIframeAPIReady() {
	player = new YT.Player('player', {
		// height: '360',
		// width: '640',
		playerVars: {
			'autoplay': 1,
			'controls': 1,
			'enablejsapi': 1
			// 'modestbranding': 1
		},
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
	// console.log(playlist, index);

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
		// console.log('unstarted');
	}
	if (player_state === 1) {
		console.log('playing ' + currentPlaylistInfo[index].title);
		showVideoInfo(currentPlaylistInfo[index]);
	}
	if (player_state === 2) {
		// console.log('cued ' + index++);
	}
	if (player_state === 3) {
		// console.log('next ' + index);
		if (playlist[index - 1]) {
			userData.watched_list.push(playlist[index - 1]);
			// Save to storage
			updateUserData();
		}
	}
	if (player_state === 5) {
		// console.log('cued');
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
		let feed = await xhttpCall('GET', url);
		log('feed', JSON.parse(feed.response));
		let video_info = getVideoInfo(JSON.parse(feed.responseText));
		getUnwatched(video_info, loadPLayer);

	} catch (error) {
		console.log(error);
	}
}

// load player
function loadPLayer(playlist, playlist_info) {
	currentPlaylist = playlist;
	currentPlaylistInfo = playlist_info;
	// console.log('currentPlaylist', playlist);
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
	// console.log('category', categories);
	let menuDiv = document.querySelector('.dropdown-menu-content');
	menuDiv.innerHTML = `
		<div class="help">
			<div class="help-text">
				Double-click on a channel name to rename it.
				<div class="help-text-bar"></div>
			</div>
			<div class="reset-btn">RESET</div>
		</div>
	`;

	// Reset Button Listener
	resetButtonListener();

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

		let addSubreddit = document.createElement('form');
		addSubreddit.className = 'add-subreddit';

		// let form = document.createElement('form');
		let inputTxt = document.createElement('input');
		inputTxt.className = 'input-txt';
		inputTxt.placeholder = 'Add a subreddit';
		let plusBtn = document.createElement('button');
		plusBtn.className = 'btn-plus';
		plusBtn.innerHTML = '<i class="fas fa-plus"></i>';
		// form.appendChild(inputTxt);
		// form.appendChild(plusBtn);

		addSubreddit.appendChild(inputTxt);
		addSubreddit.appendChild(plusBtn);

		addSubreddit.addEventListener('keypress', (event) => {
			if (event.keyCode == 13) {
				event.preventDefault();
				plusBtn.click();
			}
		})

		catHeader.appendChild(catTitle);
		catHeader.appendChild(addSubreddit);
		// catHeader.appendChild(inputTxt);
		// catHeader.appendChild(plusBtn);

		let channel = document.createElement('ul');
		channel.className = 'tags';
		channel.id = 'ul-' + category.toLowerCase();

		categories[category].map((subreddit_name, index) => {
			let subreddit = document.createElement('li');
			subreddit.className = 'tag';
			subreddit.innerHTML = subreddit_name;
			subreddit.setAttribute('data-index', index);

			let deleteBtn = createDeleteBtn();
			subreddit.appendChild(deleteBtn);

			// Delete Subreddit Button
			deleteBtnListener(deleteBtn);

			channel.appendChild(subreddit);
		});

		catDiv.appendChild(catHeader);
		catDiv.appendChild(channel);

		menuDiv.appendChild(catDiv)
		// console.log('category', category);

		// Rename channels
		catTitle.addEventListener("dblclick", e => {
			console.log('double-clicked');
			catTitle.contentEditable = true;
			catTitle.focus();
			channelRenameListener(catTitle);
		});

		// Listen for submit
		catTitle.addEventListener('keypress', (event) => {
			if (event.keyCode == 13) {
				console.log(event);

				event.preventDefault();
				catTitle.blur();
			}
		})

		// Add Subreddit Plus Button
		plusBtn.addEventListener('click', e => {
			e.preventDefault();

			// If there is text
			if (inputTxt.value) {
				plusBtn.innerHTML = '<i class="fas fa-check-circle">';
				console.log('check subreddit', inputTxt.value);
				let resp = checkSubreddit(inputTxt.value, catTitle);
				resp.then(data => {
					// console.log('response', data);
					inputTxt.value = '';
					plusBtn.innerHTML = '<i class="fas fa-plus">';
				});
			} else {
				showToast('Enter a subreddit name!', 'error')
			}
		})
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
const getVideoInfo = (response) => {
	try {
		let feed = response.data.children;
		let video_info = [];
		for (let i = 0; i < feed.length; i++) {
			if (feed[i].data.domain == 'youtube.com' || feed[i].data.domain == 'youtu.be') {
				let id = YouTubeGetID(feed[i].data.url);
				let title = YouTubeGetID(feed[i].data.title);
				video_info.push({
					title: title,
					subreddit: feed[i].data.subreddit,
					upvotes: feed[i].data.score,
					id: id
				});
			}
		}
		return video_info;
	} catch (error) {
		return error;
	}

	function YouTubeGetID(url) {
		url = url.split(/(vi\/|v%3D|v=|\/v\/|youtu\.be\/|\/embed\/)/);
		return undefined !== url[2] ? url[2].split(/[^0-9a-z_\-]/i)[0] : url[0];
	}
}

// Remove watched videos
const getUnwatched = (videos, callback) => {

	let unWatchedList = [];
	let unWatchedInfo = [];
	let watchedStatus = false;

	// Get watchedList
	// console.log('Watched List is ' + JSON.stringify(userData.watched_list));
	let watchedList = userData.watched_list;

	for (const key in videos) {
		let id = videos[key].id;
		let info = {
			title: videos[key].title,
			subreddit: videos[key].subreddit,
			upvotes: videos[key].upvotes
		};
		watchedStatus = watchedList.includes(id);

		if (!watchedStatus) {
			unWatchedList.push(id);
			unWatchedInfo.push(info);
		}
	}

	log('unWatchedList', unWatchedList);
	callback(unWatchedList, unWatchedInfo);
}

// Check subreddit
const checkSubreddit = async (subreddit, channel) => {

	try {
		let url = `https://www.reddit.com/r/${subreddit}/top.json?t=week`;
		let results = await xhttpCall('GET', url);
		let video_info = getVideoInfo(JSON.parse(results.responseText));

		if (video_info.length > 5) {
			console.log('results', video_info.length);
			console.log('channel', channel);
			addNewSubreddit(subreddit, channel)
			return video_info;
		} else {
			console.log('not enough results');
		}
	} catch (error) {
		return error;
	}
}

// Add new subreddit to menu options
const addNewSubreddit = (subreddit, channel) => {

	let _channel = userData.channels[channel.id];
	let isAlreadyAdded = _channel.includes(subreddit);

	console.log('isAlreadyAdded', isAlreadyAdded);

	// check if subreddit is already added
	if (isAlreadyAdded) {
		// toast
		let message = `${subreddit} already added to ${channel.id} channel`;
		showToast(message, 'error');
	} else {
		let channel_ul = document.querySelector('#ul-' + channel.id.toLowerCase());

		let index = channel_ul.getElementsByTagName("li").length;

		let new_subreddit = document.createElement('li');
		new_subreddit.className = 'tag';
		new_subreddit.innerHTML = subreddit;
		new_subreddit.setAttribute('data-index', index);

		// toast
		let message = `${subreddit} added to ${channel.id} channel`
		showToast(message, 'success');

		// Add delete button
		let deleteBtn = createDeleteBtn();
		new_subreddit.appendChild(deleteBtn);

		// Delete Subreddit Button
		deleteBtnListener(deleteBtn);

		channel_ul.appendChild(new_subreddit);

		// update database
		userData.channels[channel.id].push(subreddit);
		console.log(userData.channels[channel.id]);
		updateUserData();
	}
}

// Show toast
const showToast = (message, status) => {
	let success_icon = "fas fa-check-circle icon";
	let error_icon = "fas fa-exclamation-triangle icon";

	let toastDiv = document.createElement('div');
	toastDiv.classList.add('toast');
	toastDiv.classList.add(status);
	toastDiv.classList.add('show');

	// icon
	let icon = document.createElement('i');
	if (status === 'success') {
		icon.className = success_icon;
	} else {
		icon.className = error_icon;
	}

	// toast text
	let txt = document.createElement('span');
	txt.className = 'toast-txt';
	txt.innerText = message;

	toastDiv.appendChild(icon);
	toastDiv.appendChild(txt);

	// get container
	let footer = document.querySelector('.footer');
	footer.appendChild(toastDiv);

	// hide toast
	setTimeout(() => {
		toastDiv.classList.remove('show');
	}, 5500);
}

// Show Video Info
const showVideoInfo = (info) => {
	console.log('showing info');

	let html_txt = `
	<div class="video-title">
		${info.title}
	</div>
	<div class="video-details">
		<div class="video-subreddit">
		${info.subreddit}
		</div>
		<div class="video-upvotes">
			<i class="fas fa-arrow-alt-circle-up"></i>
			<span>${info.upvotes}</span>
		</div>
	</div>
	`
	let video_info = document.querySelector('.video-info');
	video_info.innerHTML = html_txt;
	// console.log('video_info', video_info);
	video_info.classList.toggle('show-info');

	let timeout = setTimeout(() => {
		video_info.classList.toggle('show-info');
	}, 4000);

	// video_info.addEventListener('mouseover', event => {
	// 	clearTimeout(timeout);
	// 	// removeHandler();
	// });
}

document.querySelector('.channel-viewer').addEventListener('mouseout', e => {
	// console.log(e);
	document.querySelector('.dark-veil').classList.add('show');;
});

document.querySelector('.channel-viewer').addEventListener('mouseover', e => {
	// console.log(e);
	document.querySelector('.dark-veil').classList.remove('show');;
});

// Switch themes
const switchThemes = () => {
	if (document.documentElement.hasAttribute('theme')) {
		document.documentElement.removeAttribute('theme');
	}
	else {
		document.documentElement.setAttribute('theme', 'dark');
	}
}

function resetButtonListener() {
	document.querySelector('.reset-btn').addEventListener('click', e => {
		console.log('reset-event', event);
		let user_data = {
			channels: {
				videos: ['videos', 'storytellingvideos', 'Best_Of_YouTube'],
				artisans: ['artdocumentaries', 'artisanvideos'],
				mealtime: ['mealtimevideos', 'documentaries'],
				learn: ['usefulvids', 'EducativeVideos', 'spacevideos', 'CuriousVideos', 'CookingVideos'],
				trailers: ['trailers', 'CultTrailers'],
				music: ['listentothis', 'MusicVideosOnYouTube', 'fullconcertonyoutube', 'FullAlbumsOnYouTube'],
				movies: ['fullmoviesonyoutube', 'FullWesternsOnYoutube', 'CampCult'],
				obscure: ['unknownvideos', 'NotTimAndEric', 'youtubehaiku', 'DeepIntoYouTube', 'InterdimensionalCable', 'CommercialCuts', 'AwfulCommercials', 'ObscureMedia']
			},
			current: 'videos',
			sort: 'day',
			watched_list: []
		};
		userData = user_data;
		chrome.storage.local.set({ userData: user_data }, (result) => {
			console.log('Reset', result);
			menuOptions(userData.channels);
			renderChannels(userData.channels);
		});
	});
}

function channelRenameListener(catTitle) {
	catTitle.addEventListener("focusout", e => {
		catTitle.contentEditable = false;
		catTitle.innerText.trim();
		let renamed = catTitle.innerText.trim();
		renamed = renamed.toLowerCase();
		console.log('renamed', renamed);
		if (renamed !== catTitle.id) {

			// change channel name
			document.querySelector(`#${catTitle.id}`).innerText = renamed;

			// Update userData.current
			if (userData.current === catTitle.id) {
				userData.current = renamed;
			}
			userData.channels[renamed] = userData.channels[catTitle.id];
			delete userData.channels[catTitle.id];
			updateUserData();
		}
		console.log(userData.channels);
	});
}

function deleteBtnListener(deleteBtn) {
	deleteBtn.addEventListener('click', e => {

		console.log('index', e.toElement.parentElement.dataset.index);
		let index = e.toElement.parentElement.dataset.index;
		let channel = e.toElement.offsetParent.parentElement.id;
		channel = channel.split('-');
		channel = channel[1];

		let subreddit = e.target.offsetParent.textContent;
		subreddit = subreddit.substr(0, subreddit.length - 1);
		console.log('deleting subreddit', subreddit);

		// toast
		let message = `${subreddit} has been deleted from ${channel} channel`;
		showToast(message, 'error');

		// Remove from DOM
		let ul = document.getElementById("ul-" + channel);
		ul.removeChild(ul.childNodes[index]);
		// update userData
		userData.channels[channel].splice(index, 1);

		updateUserData();
	});
}

function createDeleteBtn() {
	let deleteBtn = document.createElement('span');
	deleteBtn.className = 'close';
	deleteBtn.setAttribute("aria-label", "Close");
	deleteBtn.innerHTML = '&times;';
	return deleteBtn;
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
		// console.log('Set UserData: ', userData);
		// return result;
	});
}

// Get User Favourites
const getUserFavourites = async () => {
	// showLoading();
	// Get user data from local storage
	chrome.storage.local.get(['userData'], (result) => {
		// console.log('Got UserData: ', result.userData);
		// Save to global variable
		userData = result.userData;
		// showLoading(userData.channels[userData.current].join('+'));
		renderChannels(userData.channels);
		// timeperiod
		renderSort(userData.sort);
		menuOptions(userData.channels);
		getReddit(userData.current, userData.sort);
	})
}

const renderChannels = (channels) => {
	let cat_container = document.querySelector('.categories');
	cat_container.innerHTML = '';
	
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