import type { LandTitleCertificateData } from "@/lib/certificate-data";

const OCTOPUS_LOGO = "/octopus-logo.png";

interface LandTitleCertificateViewProps {
  data: LandTitleCertificateData;
}

export function LandTitleCertificateView({ data }: LandTitleCertificateViewProps) {
  return (
    <article id="land-title-certificate-document" className="min-h-screen bg-black text-white font-sans">
      <div className="max-w-3xl mx-auto px-10 py-12">
        <p className="text-sm text-gray-400 mb-10">Unique Identifier: {data.uniqueId}</p>

        <header>
          <h1 className="text-center font-serif text-5xl md:text-6xl font-black tracking-wide mb-2 leading-tight">
            LAND OWNERSHIP TITLE
          </h1>
          <h1 className="text-center font-serif text-5xl md:text-6xl font-black tracking-wide mb-12 leading-tight">
            CERTIFICATE
          </h1>
        </header>

        <div className="space-y-1 mb-10 text-sm">
          <p>Address: Star System: Sarakt, Planet: Sarakt, Octavia Capital city,</p>
          <p className="mt-3">Issuer: Octa Investment Group</p>
          <p className="mt-3">Date of Issue: {data.dateOfIssue}</p>
        </div>

        <section>
          <h2 className="text-center text-xl font-semibold tracking-wide mb-4">I. OWNER INFORMATION</h2>
          <div className="space-y-1 text-sm mb-10">
            <p>Name: {data.ownerName}</p>
            <p>Wallet Address: {data.walletAddress}</p>
            <p>Email: {data.email || "—"}</p>
            <p>Citizen ID (if applicable): {data.citizenId || "—"}</p>
          </div>
        </section>

        <section>
          <h2 className="text-center text-xl font-semibold tracking-wide mb-4">II. PROPERTY INFORMATION</h2>
          <div className="space-y-1 text-sm mb-10">
            <p>Plot ID: {data.plotId}</p>
            <p>Coordinates / Sector: {data.coordinatesSector}</p>
            <p>Zone Type: {data.zoneType}</p>
            <p>Activation Date: {data.activationDate}</p>
            <p>NFT Token ID: {data.nftTokenId}</p>
            <p>Transaction Hash: {data.transactionHash}</p>
          </div>
        </section>

        <section>
          <h2 className="text-center text-xl font-semibold tracking-wide mb-4">III. TITLE GRANT</h2>
          <p className="text-sm leading-relaxed mb-2">
            This certificate confirms that the individual named above is the lawful holder of title
            to the land described herein. Title is issued pursuant to the governing rules of the
            Sarakt Land Registry and is recorded on the blockchain. Ownership is represented by the
            corresponding cryptographic token (NFT) and registry entry. On-chain ledger records
            constitute the primary and controlling evidence of ownership.
          </p>
          <p className="text-sm leading-relaxed mb-16">
            This Certificate serves as physical documentary proof of title but remains subordinate
            to blockchain state.
          </p>
        </section>

        <div className="flex items-start justify-between gap-8 mb-16">
          <div className="space-y-8">
            <div>
              <p className="text-xs uppercase tracking-widest text-white/60 mb-1.5">Buyer</p>
              <p className="font-signature text-2xl text-white border-b border-white/40 pb-1 inline-block min-w-[12rem]">
                Georgi Penev
              </p>
              <p className="text-sm text-white/60 mt-2">Date: {data.dateOfIssue}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-white/60 mb-1.5">Seller</p>
              <p className="text-base font-medium text-white border-b border-white/40 pb-1 inline-block min-w-[12rem]">
                Octa Investment Group
              </p>
              <p className="text-sm text-white/60 mt-2">Date: {data.dateOfIssue}</p>
            </div>
          </div>
          <div className="flex flex-col items-center shrink-0 text-center min-w-[14rem]">
            <p className="font-signature text-5xl tracking-wide">Georgi Penev</p>
            <img src={OCTOPUS_LOGO} alt="Octa Investment Group seal" className="w-40 h-36 mt-3 object-contain" />
          </div>
        </div>

        <hr className="my-16 border-0 border-t border-white/20" />

        <section>
          <h2 className="text-center text-xl font-semibold tracking-wide mb-4">IV. RIGHTS AND INTERESTS</h2>
          <p className="text-sm leading-relaxed mb-3">
            The Owner is granted the following rights, subject to City Code and future regulatory
            enactments:
          </p>
          <ul className="list-disc list-inside text-sm space-y-1 mb-4 pl-4">
            <li>Exclusive right of possession and use of the plot</li>
            <li>Right to develop, build, and operate structures consistent with zoning</li>
            <li>Right to lease or encumber the parcel</li>
            <li>Right to transfer title, subject to administrative approval and execution on-chain</li>
          </ul>
          <p className="text-sm leading-relaxed mb-12">
            The Owner agrees to comply with all land-use and development regulations in force within
            Octavia Capital City.
          </p>
        </section>

        <section>
          <h2 className="text-center text-xl font-semibold tracking-wide mb-4">V. BLOCKCHAIN RECORD DATA</h2>
          <div className="space-y-1 text-sm mb-12">
            <p>NFT Token ID: {data.nftTokenId}</p>
            <p>Token Contract Address: {data.tokenContractAddress}</p>
            <p>Activation Transaction Hash: {data.transactionHash}</p>
            <p>Date of Title Issuance: {data.dateOfIssue}</p>
          </div>
        </section>

        <section>
          <h2 className="text-center text-xl font-semibold tracking-wide mb-4">VI. CERTIFICATION AND EXECUTION</h2>
          <p className="text-sm leading-relaxed mb-12">
            By issuance of this certificate, the Sarakt Land Authority certifies the ownership and
            registration of the above-described parcel.
          </p>
        </section>

        <section>
          <h2 className="text-center text-xl font-semibold tracking-wide mb-4">VII. LEGAL NOTICE</h2>
          <p className="text-sm leading-relaxed mb-2">
            This certificate is valid only when corresponding blockchain entry exists. Any conflict
            between this document and cryptographic ledger records shall be resolved in favor of the
            ledger.
          </p>
          <p className="text-sm leading-relaxed mb-16">
            Forgery, unauthorized alteration, or misrepresentation may result in nullification of
            this certificate and legal action in accordance with Sarakt civil code.
          </p>
        </section>

        <div className="flex items-start justify-between gap-8 mb-16">
          <div className="space-y-8">
            <div>
              <p className="text-xs uppercase tracking-widest text-white/60 mb-1.5">Buyer</p>
              <p className="font-signature text-2xl text-white border-b border-white/40 pb-1 inline-block min-w-[12rem]">
                Georgi Penev
              </p>
              <p className="text-sm text-white/60 mt-2">Date: {data.dateOfIssue}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-white/60 mb-1.5">Seller</p>
              <p className="text-base font-medium text-white border-b border-white/40 pb-1 inline-block min-w-[12rem]">
                Octa Investment Group
              </p>
              <p className="text-sm text-white/60 mt-2">Date: {data.dateOfIssue}</p>
            </div>
          </div>
          <div className="flex flex-col items-center shrink-0 text-center min-w-[14rem]">
            <p className="font-signature text-5xl tracking-wide">Georgi Penev</p>
            <img src={OCTOPUS_LOGO} alt="Octa Investment Group seal" className="w-40 h-36 mt-3 object-contain" />
          </div>
        </div>
      </div>
    </article>
  );
}
