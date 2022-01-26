// Peer ID and port correspond with values in docker-compose.yml
const localDockerWakuNodePeerId =
  '16Uiu2HAmNCxLZCkXNbpVPBpSSnHj9iq4HZQj7fxRzw2kj1kKSHHA';

const localDockerWakuNodeWsPort = 9001;

export const localDockerWakuNodeBootstrapAddr = `/ip4/127.0.0.1/tcp/${localDockerWakuNodeWsPort}/ws/p2p/${localDockerWakuNodePeerId}`;
