import http from 'http';
import app from './app';

const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`HomeCareX server running on port ${PORT}`);
});
