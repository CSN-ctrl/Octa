import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import { TransferSingle } from "../generated/SaraktLandV2/SaraktLandV2";
import { PlotTransfer } from "../generated/schema";

export function handleTransferSingle(event: TransferSingle): void {
  const id = event.transaction.hash.toHex() + "-" + event.logIndex.toString();

  let transfer = new PlotTransfer(id);
  transfer.plotId = event.params.id;
  transfer.operator = event.params.operator;
  transfer.from = event.params.from;
  transfer.to = event.params.to;
  transfer.value = event.params.value;
  transfer.timestamp = event.block.timestamp;
  transfer.blockNumber = event.block.number;
  transfer.transactionHash = event.transaction.hash;
  transfer.save();
}
