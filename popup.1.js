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

const getReddit = (_category, _timeperiod) => {

	try {
		if (_category) {
			category = _category;
			// turn off all selection
		}

		if (_timeperiod) {
			timeperiod = _timeperiod;
		}

		let url = `https://www.reddit.com/r/${category}/top.json?t=${timeperiod.toLowerCase()}`;
		console.log(`url: ${JSON.stringify(url, null, 2)}`);

		let feed = xhttpCall('GET', url);

		feed.then(data => {
			// console.log(JSON.parse(data));

			let url = getVideoPlaylist(JSON.parse(data.responseText));

			let playlist_url = xhttpCall('GET', url);
			// console.log(playlist_url);

			embedYoutube(playlist_url);

		});
	} catch (error) {
		console.log(error);
	}
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

const getUnreadPost = (postArr, idArr) => {
	try {
		let post_status = false;
		let post;

		for (const key in postArr) {
			let id = postArr[key].id;

			post_status = idArr.includes(id);

			if (!post_status) {
				post = postArr[key];
				break;
			}
		}
		return post;

	} catch (error) {

		try {
			return postArr[0];	
		} catch (error) {
			return error;
		}
	}
}

// Show only unwatched

/*

get video ids from reddit


check with watchedlist array


create playlist of unwatched


when finished playing, add to watchedlist


cleanup db every month end

*/

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

const getVideoPlaylist = (response) => {
	try {
		let feed = response.data.children;
		let video_ids = [];
		let playlist_url = 'https://www.youtube.com/watch_videos?video_ids=';

		for (let i = 0; i < feed.length; i++) {
			if (feed[i].data.domain == 'youtube.com' || feed[i].data.domain == 'youtu.be') {
				let id = YouTubeGetID(feed[i].data.url);
				let data = {
					title: feed[i].data.title,
					video_id: id
				}
				video_ids.push(data);
				playlist_url += id + ','
			}
		}

		return playlist_url;
	} catch (error) {
		return error;
	}

	function YouTubeGetID(url) {
		url = url.split(/(vi\/|v%3D|v=|\/v\/|youtu\.be\/|\/embed\/)/);
		return undefined !== url[2] ? url[2].split(/[^0-9a-z_\-]/i)[0] : url[0];
	}
}

function embedYoutube(playlist) {
	playlist.then(result => {
		console.log(result);
		// https://www.youtube.com/watch?v=tgCkmUS1IYI&list=TLGGKHzrbZHOa7EwNzAyMjAxOQ
		let _res = result.responseURL.split('&');
		let playlist_id = _res[1].split('=');

		let embed_original = `<iframe class="video-frame" width="560" height="315" src="https://www.youtube.com/embed/videoseries?list=${playlist_id[1]}&autoplay=1&rel=0" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
		let testing = `<iframe width="560" height="315"
		src="https://www.youtube.com/embed/videoseries?list=${playlist_id[1]}&autoplay=1&mute=2"
		frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`
		// let media_url = playlist_url.replace("watch_videos?video_ids=", "embed/");
		videoContainer.innerHTML = testing;
	})
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

// chrome.browserAction.setBadgeText({ text: "444" });

// // Chrome Storage
// chrome.storage.sync.set({ userData: value }, function () {
// 	console.log('Value is set to ' + value);
// });

// chrome.storage.sync.get(['key'], function (result) {
// 	console.log('Value currently is ' + result.key);
// });

// Get User Favourites
const getUserFavourites = () => {
	chrome.storage.sync.get(['userData'], (result) => {
		console.log('UserData: ' + JSON.stringify(result.userData));
		if (result.userData) {
			showLoading(result.userData.favourites[result.userData.current].join('+'));
			renderCategories(result.userData);
			let currentCategory = result.userData.favourites[result.userData.current].join('+');

			console.log('result: ' + JSON.stringify(result.userData.current));
			document.getElementById(result.userData.current).classList.add('selected');
			document.getElementById(result.userData.sort).classList.add('selected');

			user_data = result.userData;
			updateUserData(user_data);
			getReddit(currentCategory, result.userData.sort);
		} else {
			console.log('UserData: Else ');
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
		console.log('Set UserData: ' + JSON.stringify(data));
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

getUserFavourites();
getFollowerCount();
/*

<div id="videos" class="button-lg">
				Videos
			</div>
			<div id="ArtisanVideos" class="button-lg">
				Artisan
			</div>
			<div id="mealtimevideos" class="button-lg">
				Mealtime
			</div>
			<div id="PoliceChases" class="button-lg">
				Police Chases
			</div>
			<div id="usefulvids" class="button-lg">
				Useful
			</div>
			<div id="trailers" class="button-lg">
				Trailers
			</div>
			<div id="listentothis" class="button-lg">
				Music
			</div>

Favourites
	videos
		videos
	mealtimevideos
		mealtimevideos
	PoliceChases
		PoliceChases
	Useful
		usefulvids
	Trailers
		trailers
	Music
		listentothis

	sort
		week

Suggestions
	subreddit
	subreddit

*/

