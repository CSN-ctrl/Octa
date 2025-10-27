import axios from "axios";
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;

export async function uploadDeedToPinata(deed: object) {
  const res = await axios.post(
    "https://api.pinata.cloud/pinning/pinJSONToIPFS",
    deed,
    { headers: { Authorization: `Bearer ${PINATA_JWT}`, "Content-Type": "application/json" } }
  );
  return res.data.IpfsHash;
}
