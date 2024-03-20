import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import './App.css';
import Hls from 'hls.js'; // Import hls.js library

function App() {
  const [animeData, setAnimeData] = useState([]);
  const [popular, setPopular] = useState([]);
  const [selectedAnimeInfo, setSelectedAnimeInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [episodes, setEpisodes] = useState([]);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [selectedQuality, setSelectedQuality] = useState(null); // State for selected quality
  const videoRef = useRef(null); // Ref for the video element
  const [hls, setHls] = useState(null); // State for hls.js instance

  const apiUrl = 'https://luffy-api.vercel.app/meta/anilist/';
  const infoUrl = 'https://luffy-api.vercel.app/meta/anilist/info/';
  const episodeApiUrl = 'https://luffy-api.vercel.app/meta/anilist/watch/';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${apiUrl}trending`, {
          params: {
            page: 1,
            perPage: 20,
          },
        });

        const { results } = response.data;
        setAnimeData(results);
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, []);
  

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${apiUrl}popular`, {
          params: {
            page: 1,
            perPage: 20,
          },
        });

        const { results } = response.data;
        setPopular(results);
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, []);

  const fetchAnimeInfo = async (animeId) => {
    try {
      setLoading(true);
      const response = await axios.get(`${infoUrl}${animeId}`, {
        params: {
          provider: 'gogoanime',
        },
      });

      const animeInfo = response.data;
      setSelectedAnimeInfo(animeInfo);
      if (animeInfo.episodes) {
        setEpisodes(animeInfo.episodes);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEpisodeDetails = async (episodeId) => {
    try {
      setLoading(true);
      const response = await axios.get(`${episodeApiUrl}${episodeId}`);
      const episodeDetails = response.data;
      setSelectedEpisode(episodeDetails);

      // Assuming that the episodeDetails contain an HLS URL
      if (episodeDetails.sources && episodeDetails.sources.length > 0) {
        // Set the initial selected quality to the default (or any desired quality)
        setSelectedQuality('360p');
        
        // Create an HLS instance
        const hlsInstance = new Hls();
        setHls(hlsInstance); // Set the hls.js instance in state

        // Attach the HLS stream to the video element
        hlsInstance.attachMedia(videoRef.current);

        // Handle HLS events if needed (e.g., errors)
        hlsInstance.on(Hls.Events.ERROR, (event, data) => {
          console.error('HLS error', data.type, data.details);
        });

        // Load the initial HLS source URL
        const initialSource = episodeDetails.sources.find(
          (source) => source.quality === selectedQuality
        );

        if (initialSource) {
          hlsInstance.loadSource(initialSource.url);
          hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
            // Start playing the video after the manifest is parsed
            videoRef.current.play();
          });
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Function to change the quality and load the corresponding HLS source
  const changeQuality = (quality, sourceUrl) => {
    setSelectedQuality(quality);

    if (hls) {
      // Load the selected HLS source URL
      hls.loadSource(sourceUrl);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        // Start playing the video after the manifest is parsed
        videoRef.current.play();
      });
    }
  };
  return (
    <div className='container'>
      <h1>Trending</h1>
      <div className='anime-list'>
        {animeData.map((anime) => (
          <div
            className='anime-card'
            key={anime.id}
            style={{ backgroundColor: anime.color }}
            onClick={() => fetchAnimeInfo(anime.id)}>
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

      <h1>Popular</h1>
      <div className='anime-list'>
        {popular.map((anime) => (
          <div
            className='anime-card'
            key={anime.id}
            style={{ backgroundColor: anime.color }}
            onClick={() => fetchAnimeInfo(anime.id)}>
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

      {selectedAnimeInfo && (
        <div className='selected-anime-info'>
          <h2>Selected Anime Info</h2>
          <p>Title: {selectedAnimeInfo.title.english}</p>
          <p>Summary: {selectedAnimeInfo.description}</p>
        </div>
      )}

      {episodes.length > 0 && (
        <div className='episode-list'>
          <h2>Episodes</h2>
          <ul>
            {episodes.map((episode) => (
              <li
                key={episode.id}
                onClick={() => fetchEpisodeDetails(episode.id)}
              >
                Episode {episode.episode}: {episode.id}
              </li>
            ))}
          </ul>
        </div>
      )}

      {loading && <p>Loading anime info...</p>}

      {/* Render the video element for HLS playback */}
      <div className='hls-player-container'>
        <video ref={videoRef} controls width="100%" height="auto" />
      </div>
      <div className="inset">
      {selectedEpisode && (
        <div className='selected-episode-info'>
          <h2>Selected Episode Info</h2>
          <p>Title: {selectedEpisode.title}</p>
          <p>Duration: {selectedEpisode.duration} minutes</p>
          {/* Add more episode details here as needed */}

          {/* Quality selection */}
          <div className='quality-selection'>
            <h3>Select Quality:</h3>
            <ul>
              {selectedEpisode.sources.map((source) => (
                <li
                  key={source.quality}
                  onClick={() => changeQuality(source.quality, source.url)}
                  className={source.quality === selectedQuality ? 'selected' : ''}
                >
                  {source.quality}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

export default App;
