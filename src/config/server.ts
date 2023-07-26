import * as http from 'http';
import { environment as env } from '../utils/config/environment';
export const startServer = (
  server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>
) => {
  try {
    if (env.appEnv === 'development') {
      //remember to change this to production
      for (const signal of ['SIGINT', 'SIGTERM']) {
        process.on(signal, () =>
          server.close((err) => {
            if (err) {
              console.log(err);
              process.exit(1);
            }
            console.log(`Server closed with signal: ${signal}`);
            process.exit(0);
          })
        );
      }
    }
    server.listen(env.port, () => {
      console.log(`Server listening on port ${env.port}`);
    });
  } catch (error) {
    console.error(error);
  }
};
