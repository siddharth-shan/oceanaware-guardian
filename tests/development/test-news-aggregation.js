import { EnhancedNewsService } from './server/services/enhancedNewsService.js';

async function testNewsAggregation() {
  console.log('Running test: testNewsAggregation');

  const newsService = new EnhancedNewsService();

  // Mock fetch to return controlled data for NewsAPI and Reddit
  global.fetch = async (url) => {
    if (url.includes('newsapi.org')) {
      const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000);
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      return {
        ok: true,
        json: async () => ({
          articles: [
            {
              title: 'NewsAPI Recent Wildfire',
              description: 'A recent wildfire incident.',
              url: 'http://newsapi.com/recent-wildfire',
              publishedAt: oneHourAgo.toISOString(),
            },
            {
              title: 'NewsAPI Old Wildfire',
              description: 'An old wildfire incident.',
              url: 'http://newsapi.com/old-wildfire',
              publishedAt: threeDaysAgo.toISOString(),
            },
            {
              title: 'NewsAPI Recent Non-Fire News',
              description: 'Just some general news.',
              url: 'http://newsapi.com/recent-non-fire',
              publishedAt: oneHourAgo.toISOString(),
            },
          ],
        }),
      };
    } else if (url.includes('reddit.com')) {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
      return {
        ok: true,
        json: async () => ({
          data: {
            children: [
              {
                data: {
                  id: 'reddit_new',
                  title: 'Reddit New Wildfire Post',
                  selftext: 'This is a new wildfire post.',
                  permalink: '/r/wildfire/new',
                  created_utc: Math.floor(twoHoursAgo.getTime() / 1000),
                },
              },
              {
                data: {
                  id: 'reddit_old',
                  title: 'Reddit Old Wildfire Post',
                  selftext: 'This is an old wildfire post.',
                  permalink: '/r/wildfire/old',
                  created_utc: Math.floor(fourDaysAgo.getTime() / 1000),
                },
              },
            ],
          },
        }),
      };
    } else if (url.includes('incidents.fire.ca.gov')) {
      const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
      return {
        ok: true,
        json: async () => ({
          features: [
            {
              properties: {
                UniqueId: 'calfire_new',
                IncidentName: 'CAL FIRE Recent Incident',
                IncidentType: 'Wildfire',
                CanonicalUrl: 'http://calfire.ca.gov/recent',
                Started: oneDayAgo.toISOString(),
              },
            },
            {
              properties: {
                UniqueId: 'calfire_old',
                IncidentName: 'CAL FIRE Old Incident',
                IncidentType: 'Wildfire',
                CanonicalUrl: 'http://calfire.ca.gov/old',
                Started: threeDaysAgo.toISOString(),
              },
            },
          ],
        }),
      };
    }
    return { ok: true, json: async () => ({ articles: [], data: { children: [] }, features: [] }) };
  };

  try {
    const result = await newsService.aggregateFireNews({}, { limit: 10 });
    console.log('Aggregated articles:', result.articles);

    const newsApiArticles = result.articles.filter(a => a.source === 'NewsAPI');
    const redditArticles = result.articles.filter(a => a.source === 'Reddit');
    const calFireArticles = result.articles.filter(a => a.source === 'CAL_FIRE_INCIDENTS_API');

    console.log('NewsAPI articles in final result:', newsApiArticles.length);
    console.log('Reddit articles in final result:', redditArticles.length);
    console.log('CAL FIRE articles in final result:', calFireArticles.length);

    // Assertions
    if (newsApiArticles.length > 0 && redditArticles.length > 0 && calFireArticles.length > 0) {
      console.log('Test Passed: Articles from all sources are present.');
    } else {
      console.error('Test Failed: Articles from one or more sources are missing.');
    }

    const allRecent = result.articles.every(article => {
      const articleDate = new Date(article.publishedAt);
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      return articleDate.getTime() > twoDaysAgo.getTime();
    });

    if (allRecent) {
      console.log('Test Passed: All articles are recent.');
    } else {
      console.error('Test Failed: Some articles are not recent.');
    }

  } catch (error) {
    console.error('Test failed with an error:', error);
  } finally {
    delete global.fetch;
  }
}

testNewsAggregation();
