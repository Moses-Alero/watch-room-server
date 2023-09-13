import { KurentoSession } from './kurento';

const kurentoSession = new KurentoSession();

async function getKurento() {
  kurentoSession.getKurentoClient((err: any, _kurentoClient: any) => {
    if (err) {
      console.log(err);
    }
    console.log(_kurentoClient);
  });
}

getKurento();
