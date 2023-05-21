import React, { useState, useEffect } from 'react';

const App = () => {
  const [animeDetails, setAnimeDetails] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchAnimeDetails = async () => {
      if (searchQuery.trim() === '') return;

      const query = `
        query ($searchQuery: String) {
          Page {
            media(search: $searchQuery, type: ANIME) {
              id
              title {
                romaji
                english
                native
              }
              description
              genres
              episodes
              averageScore
              startDate {
                year
                month
                day
              }
              endDate {
                year
                month
                day
              }
              coverImage {
                medium
              }
            }
          }
        }
      `;

      const variables = {
        searchQuery: searchQuery.trim(),
      };

      const url = 'https://graphql.anilist.co';
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      };

      try {
        const response = await fetch(url, options);
        const { data } = await response.json();
        const searchResults = data.Page.media;
        setAnimeDetails(searchResults[0]);
      } catch (error) {
        handleError(error);
      }
    };

    fetchAnimeDetails();
  }, [searchQuery]);

  const handleError = (error) => {
    alert('Error, check console');
    console.error(error);
  };

  const handleSearchInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="container">
      <div>
        <input
          type="text"
          placeholder="Enter anime title"
          value={searchQuery}
          onChange={handleSearchInputChange}
        />
      </div>
      {animeDetails ? (
        <div className='art-grid'>
          <h2>{animeDetails.title.romaji}</h2>
          <img className='art' src={animeDetails.coverImage.medium} alt="Anime Cover" />
          <div className='about-page'> <p dangerouslySetInnerHTML={{ __html: animeDetails.description }}></p></div>
          <section className='data'>
          <p>Genres: {animeDetails.genres ? animeDetails.genres.join(', ') : 'N/A'}</p>
          <p>Episodes: {animeDetails.episodes}</p>
          <p>Average Score: {animeDetails.averageScore}</p>
          <p>Start Date: {animeDetails.startDate.year}/{animeDetails.startDate.month}/{animeDetails.startDate.day}</p>
          <p>End Date: {animeDetails.endDate.year}/{animeDetails.endDate.month}/{animeDetails.endDate.day}</p>
        </section>
        </div>
      ) : (
        <></>
      )}
    </div>
  );
};

export default App;
