import axios from "axios";
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;

export async function uploadPDFToPinata(pdfBytes: Uint8Array, fileName: string) {
  const formData = new FormData();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  formData.append("file", blob, fileName);

  const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
    headers: {
      Authorization: `Bearer ${PINATA_JWT}`,
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data.IpfsHash; // PDF CID
}
