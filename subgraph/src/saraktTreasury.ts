import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import { AvaxSwappedForXbgl } from "../generated/SaraktTreasury/SaraktTreasury";
import { AvaxDeposit } from "../generated/schema";

export function handleAvaxSwappedForXbgl(event: AvaxSwappedForXbgl): void {
  const id = event.transaction.hash.toHex() + "-" + event.logIndex.toString();

  let deposit = new AvaxDeposit(id);
  deposit.buyer = event.params.buyer;
  deposit.avaxIn = event.params.avaxIn;
  deposit.xbglOut = event.params.xbglOut;
  deposit.timestamp = event.block.timestamp;
  deposit.blockNumber = event.block.number;
  deposit.transactionHash = event.transaction.hash;
  deposit.save();
}
