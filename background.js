let user_data = {
	channels: {
		videos: ['videos', 'storytellingvideos', 'Best_Of_YouTube'],
		art: ['artdocumentaries', 'artisanvideos'],
		mealtime: ['mealtimevideos'],
		learn: ['usefulvids', 'EducativeVideos', 'spacevideos', 'CuriousVideos', 'CookingVideos'],
		trailers: ['trailers', 'CultTrailers', 'CampCult'],
		music: ['listentothis', 'MusicVideosOnYouTube', 'fullconcertonyoutube', 'FullAlbumsOnYouTube'],
		movies: ['fullmoviesonyoutube', 'FullWesternsOnYoutube'],
		obscure: ['unknownvideos', 'NotTimAndEric', 'youtubehaiku', 'DeepIntoYouTube', 'InterdimensionalCable', 'CommercialCuts', 'AwfulCommercials', 'ObscureMedia']
	},
	current: 'videos',
	sort: 'day',
	watched_list: []
}

// Run when installed or first time
const installed = (e) => {
	if (e.reason === 'install') {
		chrome.storage.local.set({ userData: user_data }, (result) => {
			console.log('Saved Subreddit List', result);
		});
	}
}

chrome.runtime.onInstalled.addListener(installed);