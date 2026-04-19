const treasuryBalance = Number(process.env.TREASURY_BALANCE_XBGL || "0");
const expectedOutflow = Number(process.env.EXPECTED_OUTFLOW_XBGL || "0");
const expectedInflow = Number(process.env.EXPECTED_INFLOW_XBGL || "0");

if (!Number.isFinite(treasuryBalance) || !Number.isFinite(expectedOutflow) || !Number.isFinite(expectedInflow)) {
  console.error("Economic safety simulation inputs are invalid.");
  process.exit(1);
}

const projectedBalance = treasuryBalance + expectedInflow - expectedOutflow;
const solvencyRatio = treasuryBalance > 0 ? projectedBalance / treasuryBalance : 0;

if (projectedBalance < 0) {
  console.error(
    `Economic safety simulation failed: projected balance ${projectedBalance.toFixed(4)} xBGL is negative.`,
  );
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      treasuryBalance,
      expectedInflow,
      expectedOutflow,
      projectedBalance,
      solvencyRatio,
      status: "pass",
    },
    null,
    2,
  ),
);
