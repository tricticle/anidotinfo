// src/App.jsx
import React, { useRef, useEffect, useState } from 'react';
import axios from 'axios';
import './App.css'; // Import the CSS file at the top of your App.jsx
import Hls from 'hls.js';

function App() {
  const [animeData, setAnimeData] = useState([]);
  const [popular, setPopular] = useState([]);
  const [selectedAnime, setSelectedAnime] = useState(null);
  const [episodeUrls, setEpisodeUrls] = useState([]);
  const [selectedQuality, setSelectedQuality] = useState('');
  const [totalEpisodes, setTotalEpisodes] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const handleSearch = async () => {
    try {
      // Make a request to the AniList API with the search query
      const response = await axios.get(`${url}${searchQuery}`, {
        params: {
          page: 1,
          perPage: 20,
        },
      });

      const { results } = response.data;
      console.log(response.data)

      // Update the search results state
      setSearchResults(results);
    } catch (error) {
      console.error(error);
    }
  };

  const url = 'https://api.consumet.org/meta/anilist/';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${url}trending`, {
          params: {
            page: 1,
            perPage: 20,
          },
        });

        const { results } = response.data;

        // Process the data if needed
        setAnimeData(results);
        console.log(results);
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${url}popular`, {
          params: {
            page: 1,
            perPage: 20,
          },
        });

        const { results } = response.data;

        // Process the data if needed
        setPopular(results);
        console.log(results);
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, []);

  const toggleInset = () => {
    setSelectedAnime(selectedAnime ? null : selectedAnime);
  };


  const fetchEpisodesByTitle = async (title, episodeNumber) => {
    try {
      const formattedTitle = title.replace(/ /g, '-').toLowerCase() + `-episode-${episodeNumber}`;
      const response = await axios.get(`https://api.consumet.org/meta/anilist/watch/${formattedTitle}`);
      const episodes = response.data;
      return episodes;
    } catch (error) {
      console.error(error);
      return [];
    }
  };

  const loadAnimeDetails = async (animeId) => {
    try {
      const response = await axios.get(`${url}info/${animeId}`, {
        params: {
          provider: 'gogoanime',
        },
      });
      const data = response.data;
      setSelectedAnime(data);
  
      // Fetch the total number of episodes for the selected anime
      setTotalEpisodes(data.totalEpisodes);
  
      // Try loading episodes by anime title (English first)
      let episodes = await fetchEpisodesByTitle(data.title.english, 1);
  
      // If loading by English title fails, try loading by romaji title
      if (episodes.length === 0) {
        episodes = await fetchEpisodesByTitle(data.title.romaji, 1);
      }
  
      // If loading by romaji title fails, try loading by Japanese title
      if (episodes.length === 0) {
        episodes = await fetchEpisodesByTitle(data.title.japanese, 1);
      }
  
      setEpisodeUrls(episodes.sources);
      setSelectedQuality(episodes.sources[0].quality); // Set the default quality
    } catch (error) {
      console.error(error);
    }
  };  
  
  const selectEpisode = async (episodeNumber) => {
    // Try selecting episodes by English title first
    let episodes = await fetchEpisodesByTitle(selectedAnime.title.english, episodeNumber);
  
    // If selecting by English title fails, try selecting by romaji title
    if (episodes.length === 0) {
      episodes = await fetchEpisodesByTitle(selectedAnime.title.romaji, episodeNumber);
    }
  
    setEpisodeUrls(episodes.sources);
    setSelectedQuality(episodes.sources[0].quality);
  };
  

  const VideoPlayer = ({ episodeUrl }) => {
    const videoRef = useRef(null);
  
    useEffect(() => {
      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(episodeUrl);
        hls.attachMedia(videoRef.current);
      }
    }, [episodeUrl]);
  
    return (
      <video
      ref={videoRef}
      controls
      poster={selectedAnime ? selectedAnime.image : ''}
    >
        Your browser does not support the video tag.
      </video>
    );
  };

  return (
    <div className='container'>
      <h1>trending</h1>
      <div className='search-box'>
        <input
          type='text'
          placeholder='Search for anime...'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button onClick={handleSearch}>Search</button>
      </div>
      <div className='search-results'>
        <div className="anime-list">
        {searchResults.map((anime) => (
          <div
            className='anime-card'
            key={anime.id}
            style={{ backgroundColor: anime.color }}
            onClick={() => loadAnimeDetails(anime.id)}
          >
          <img src={anime.image} alt={anime.title.english} />
          <div className='ani-detail'>
              <h3>{anime.title.english}</h3>
              <p>Type: {anime.type}</p>
              <p>Rating: {anime.rating}</p>
              <p>Release Date: {anime.releaseDate}</p>
            </div>
          </div>
        ))}
        </div>
      </div>
      <div className='anime-list'>
        {animeData.map((anime) => (
          <div
            className='anime-card'
            key={anime.id}
            style={{ backgroundColor: anime.color }}
            onClick={() => loadAnimeDetails(anime.id)} // Load details on click
          >
            <img src={anime.image} alt={anime.title.english} />
            <div className='ani-detail'>
              <h3>{anime.title.english}</h3>
              <p>Type: {anime.type}</p>
              <p>Rating: {anime.rating}</p>
              <p>Release Date: {anime.releaseDate}</p>
            </div>
          </div>
        ))}
        <div className={`inset ${selectedAnime ? 'show' : 'hide'}`}>
          {selectedAnime && (
            <div className='anime-episodes' style={{ backgroundImage: `url(${selectedAnime.cover})`, backgroundSize: 'cover' }}>
              <button className="close-button" onClick={toggleInset}> <i className="fas fa-close"></i></button>
                {selectedQuality && (
                  <div className="video">
                <VideoPlayer episodeUrl={episodeUrls.find((episode) => episode.quality === selectedQuality).url} />
                  </div>
                )}
                <div className="ani-detail">
                <h3>{selectedAnime.title.english}</h3>
              <div dangerouslySetInnerHTML={{ __html: selectedAnime.description }} />
              <p>Available Qualities:</p>
                </div>
              <div className='server-list'>
                {episodeUrls.map((episode, index) => (
                  <div className='server-btn' key={index}>
                    <button onClick={() => setSelectedQuality(episode.quality)}>{episode.quality}</button>
                  </div>
                ))}
              </div>
              {totalEpisodes > 1 && (
              <div className="episode-list">
                    {[...Array(totalEpisodes)].map((_, index) => (
                        <button onClick={() => selectEpisode(index + 1)}>Episode {index + 1}</button>
                    ))}
                </div>
              )}
              </div>
          )}
        </div>
        <h1>popular</h1>
        <div className='anime-list'>
        {popular.map((anime) => (
          <div className='anime-card' key={anime.id} style={{ backgroundColor: anime.color }} onClick={() => loadAnimeDetails(anime.id)}>
            <img src={anime.image} alt={anime.title.english} />
            <div className='ani-detail'>
              <h3>{anime.title.english}</h3>
              <p>Type: {anime.type}</p>
              <p>Rating: {anime.rating}</p>
              <p>Release Date: {anime.releaseDate}</p>
          </div>
          </div>
        ))}
                    </div>
      </div>
    </div>
  );
}

export default App;
