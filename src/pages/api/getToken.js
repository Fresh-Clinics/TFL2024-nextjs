import axios from 'axios';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { company_login, api_key } = req.body;

    try {
      const response = await axios.post('https://user-api.simplybook.me/login', {
        jsonrpc: '2.0',
        method: 'getToken',
        params: {
          company_login,
          api_key,
        },
        id: 1,
      });

      if (response.data.result) {
        return res.status(200).json({ token: response.data.result });
      } else {
        return res.status(400).json({ error: 'Failed to fetch SimplyBook token' });
      }
    } catch (error) {
      console.error('Error fetching token from SimplyBook:', error);
      return res.status(500).json({ error: 'Failed to fetch SimplyBook token' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
