const defaultPortNumber = 8080;
const defaultAppEnv = 'development';
interface Environment {
  port: number;
  appEnv: string;
}

export const environment: Environment = {
  port: Number(process.env.PORT) || defaultPortNumber,
  appEnv: process.env.NODE_ENV || defaultAppEnv, // development, production
};
