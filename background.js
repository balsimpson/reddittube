let user_data = {
	channels: {
		Videos: ['videos', 'storytellingvideos', 'Best_Of_YouTube'],
		Art: ['artdocumentaries', 'artisanvideos'],
		Mealtime: ['mealtimevideos'],
		Learn: ['usefulvids', 'EducativeVideos', 'spacevideos', 'CuriousVideos', 'CookingVideos'],
		Trailers: ['trailers', 'CultTrailers', 'CampCult'],
		Music: ['listentothis', 'MusicVideosOnYouTube', 'fullconcertonyoutube', 'FullAlbumsOnYouTube'],
		Movies: ['fullmoviesonyoutube', 'FullWesternsOnYoutube'],
		Obscure: ['unknownvideos', 'NotTimAndEric', 'youtubehaiku', 'DeepIntoYouTube', 'InterdimensionalCable', 'CommercialCuts', 'AwfulCommercials', 'ObscureMedia']
	},
	current: 'Videos',
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