import { useWallet } from "@/contexts/WalletContext";
import { useAccountManagement } from "@/contexts/AccountManagementContext";
import { hasLandContract } from "@/lib/contracts";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useLandPlots } from "@/hooks/useLandPlots";
import { useEffect, useState, useMemo } from "react";
import { getPortfolio, projectPortfolio, getLoanEligibility } from "@/lib/api";
import { getRpcProvider } from "@/lib/wallet";
import { ethers } from "ethers";
import { animate, stagger } from "animejs";
import { PortfolioWizard } from "@/components/financial-hub/PortfolioWizard";
import { PortfolioDashboard } from "@/components/financial-hub/PortfolioDashboard";

/**
 * Financial Hub - Portfolio Management Dashboard
 */
export default function FinancialHub() {
  const { address } = useWallet();
  const {
    userPlots: mainUserPlots,
    pendingPlots: mainPendingPlots,
    refresh: refreshPlots
  } = useLandPlots();
  const { chaosStarKeys, universalWallets } = useAccountManagement();

  // Aggregate plots from all sources
  const [allUserPlots, setAllUserPlots] = useState<number[]>([]);
  const [allPendingPlots, setAllPendingPlots] = useState<number[]>([]);

  // Fetch plots for all addresses
  useEffect(() => {
    const fetchAllPlots = async () => {
      if (!hasLandContract()) return;

      const addressesToCheck: string[] = [];
      if (address) addressesToCheck.push(address);

      if (chaosStarKeys && chaosStarKeys.length > 0) {
        chaosStarKeys.forEach((key) => {
          const keyAddr = key.evm_address || key.address || key.evmAddress;
          if (keyAddr && !addressesToCheck.includes(keyAddr)) {
            addressesToCheck.push(keyAddr);
          }
        });
      }

      if (universalWallets && universalWallets.length > 0) {
        universalWallets.forEach((wallet) => {
          if (wallet.address && !addressesToCheck.includes(wallet.address)) {
            addressesToCheck.push(wallet.address);
          }
        });
      }

      if (addressesToCheck.length === 0) {
        setAllUserPlots(mainUserPlots || []);
        setAllPendingPlots(mainPendingPlots || []);
        return;
      }

      try {
        const allOwnedPlots = new Set<number>();
        const allPendingPlotsSet = new Set<number>();

        // Fetch plots for each address - prioritize Registry API
        for (const addr of addressesToCheck) {
          try {
            console.log(`📡 Fetching plots for ${addr.slice(0, 6)}...${addr.slice(-4)}`);
            
            // Priority 1: Try Registry API (port 8000) - most reliable for PlotRegistry
            try {
              const { getRegistryPlotsByOwner } = await import("@/lib/api");
              const plotIds = await getRegistryPlotsByOwner(addr);
              if (plotIds && plotIds.length > 0) {
                console.log(`✅ Found ${plotIds.length} plots from Registry API for ${addr.slice(0, 6)}...${addr.slice(-4)}`);
                plotIds.forEach(id => allOwnedPlots.add(id));
                continue; // Success, move to next address
              }
            } catch (error: any) {
              console.debug(`Registry API failed for ${addr}, trying contract:`, error.message);
            }

            // Priority 2: Fallback to contract query
            const { fetchOwnedPlots, fetchOwnedPlotsDetailed } = await import("@/lib/plotUtils");
            const { hasLandContract } = await import("@/lib/contracts");
            
            if (hasLandContract()) {
              const plotIds = await fetchOwnedPlots(addr, 1000);
              plotIds.forEach(id => allOwnedPlots.add(id));
              
              // Also get detailed info to check for pending plots
              const detailedPlots = await fetchOwnedPlotsDetailed(addr, 1000);
              detailedPlots.forEach(plot => {
                if (plot.pending) {
                  allPendingPlotsSet.add(plot.plotId);
                }
              });
              
              console.log(`✅ Found ${plotIds.length} plots from contract for ${addr.slice(0, 6)}...${addr.slice(-4)}`);
            }
          } catch (error: any) {
            console.debug(`Failed to fetch plots for address ${addr}:`, error.message);
          }
        }

        const sortedPlots = Array.from(allOwnedPlots).sort((a, b) => a - b);
        const sortedPending = Array.from(allPendingPlotsSet).sort((a, b) => a - b);
        
        console.log(`✅ Total plots from blockchain: ${sortedPlots.length} owned, ${sortedPending.length} pending`);
        setAllUserPlots(sortedPlots);
        setAllPendingPlots(sortedPending);
      } catch (error: any) {
        console.error("Failed to fetch all plots from blockchain:", error.message);
        // Fallback to hook data
        setAllUserPlots(mainUserPlots || []);
        setAllPendingPlots(mainPendingPlots || []);
      }
    };

    fetchAllPlots();
    const interval = setInterval(fetchAllPlots, 30000);
    return () => clearInterval(interval);
  }, [address, chaosStarKeys, universalWallets, mainUserPlots, mainPendingPlots]);

  const { portfolios, totalValue: hookTotalValue, loading: portfolioLoading } = usePortfolio(address);
  const [portfolioData, setPortfolioData] = useState<any>(null);
  const [csnBalance, setCsnBalance] = useState<string>("0");

  // Fetch portfolio data (with Registry API and blockchain fallback)
  useEffect(() => {
    const fetchPortfolioData = async () => {
      if (!address) {
        setPortfolioData(null);
        return;
      }
      try {
        // Priority 1: Try backend portfolio API
        const portfolio = await getPortfolio(address).catch(() => null);
        
        if (portfolio?.portfolio) {
          setPortfolioData(portfolio.portfolio);
          console.log(`✅ Portfolio loaded from backend`);
          return;
        }
        
        // Priority 2: Create portfolio from Registry API data
        try {
          const { getRegistryPlotsByOwner, getRegistryPlot } = await import("@/lib/api");
          const { CONTRACT_ADDRESSES, PLOT_REGISTRY_ABI } = await import("@/lib/contracts");
          const plotIds = await getRegistryPlotsByOwner(address);
          
          if (plotIds && plotIds.length > 0) {
            // Fetch detailed plot data and create holdings
            const holdings = await Promise.all(
              plotIds.slice(0, 100).map(async (plotId) => {
                try {
                  const plot = await getRegistryPlot(plotId);
                  // Convert price from wei to xBGL
                  const priceInWei = BigInt(plot.price || "0");
                  const priceInXBGL = Number(ethers.formatEther(priceInWei));
                  
                  // Try to get additional metadata from contract
                  let contractMetadata = null;
                  try {
                    const provider = getRpcProvider();
                    if (provider && CONTRACT_ADDRESSES.plotRegistry) {
                      const contract = new ethers.Contract(
                        CONTRACT_ADDRESSES.plotRegistry,
                        PLOT_REGISTRY_ABI,
                        provider
                      );
                      const metadata = await contract.getPlotMetadata(plotId);
                      contractMetadata = {
                        x: Number(metadata.x),
                        y: Number(metadata.y),
                        level: Number(metadata.level),
                        issued: metadata.issued,
                        price: metadata.price,
                        planetId: metadata.planetId,
                      };
                    }
                  } catch (e) {
                    console.debug(`Failed to fetch contract metadata for plot ${plotId}:`, e);
                  }
                  
                  return {
                    asset_type: "plot",
                    identifier: String(plotId),
                    cost_basis: priceInXBGL || 100,
                    current_value: priceInXBGL || 100,
                    yield_annual: 0.05,
                    metadata: {
                      plotId,
                      x: plot.x,
                      y: plot.y,
                      level: plot.level,
                      planetId: plot.planetId,
                      price: priceInXBGL,
                      priceWei: plot.price,
                      contractMetadata,
                      source: "registry",
                      fetchedAt: new Date().toISOString(),
                      // Deed information (can be added if available from backend)
                      documents: {
                        deed: {
                          plotId,
                          coordinates: `(${plot.x}, ${plot.y})`,
                          level: plot.level,
                          price: priceInXBGL,
                          currency: "xBGL",
                        }
                      }
                    }
                  };
                } catch (e) {
                  console.debug(`Failed to fetch plot ${plotId}:`, e);
                  // Fallback to basic holding
                  return {
                    asset_type: "plot",
                    identifier: String(plotId),
                    cost_basis: 100,
                    current_value: 100,
                    yield_annual: 0.05,
                    metadata: { 
                      plotId, 
                      source: "registry",
                      documents: {
                        deed: {
                          plotId,
                          price: 100,
                          currency: "xBGL",
                        }
                      }
                    }
                  };
                }
              })
            );
            
            if (holdings.length > 0) {
              const totalValue = holdings.reduce((sum, h) => sum + (h.cost_basis || 100), 0);
              setPortfolioData({
                wallet: address,
                portfolio_type: "primary",
                holdings,
                total_value: totalValue,
                source: "registry"
              });
              console.log(`📊 Created portfolio from Registry API: ${holdings.length} plots`);
              return;
            }
          }
        } catch (error: any) {
          console.debug("Registry API not available for portfolio:", error.message);
        }
        
        // Priority 3: Create portfolio from blockchain data (allUserPlots)
        if (allUserPlots.length > 0) {
          const { CONTRACT_ADDRESSES, PLOT_REGISTRY_ABI } = await import("@/lib/contracts");
          const provider = getRpcProvider();
          
          // Fetch metadata for all plots in parallel
          const blockchainHoldings = await Promise.all(
            allUserPlots.map(async (plotId) => {
              let priceInXBGL = 100; // Default fallback
              let plotMetadata = null;
              
              try {
                if (provider && CONTRACT_ADDRESSES.plotRegistry) {
                  const contract = new ethers.Contract(
                    CONTRACT_ADDRESSES.plotRegistry,
                    PLOT_REGISTRY_ABI,
                    provider
                  );
                  const metadata = await contract.getPlotMetadata(plotId);
                  plotMetadata = {
                    x: Number(metadata.x),
                    y: Number(metadata.y),
                    level: Number(metadata.level),
                    issued: metadata.issued,
                    price: metadata.price,
                    planetId: metadata.planetId,
                  };
                  // Convert price from wei to xBGL
                  priceInXBGL = Number(ethers.formatEther(metadata.price));
                }
              } catch (e) {
                console.debug(`Failed to fetch metadata for plot ${plotId}:`, e);
              }
              
              return {
                asset_type: "plot",
                identifier: String(plotId),
                cost_basis: priceInXBGL,
                current_value: priceInXBGL,
                yield_annual: 0.05,
                metadata: {
                  plotId,
                  price: priceInXBGL,
                  contractMetadata: plotMetadata,
                  source: "blockchain",
                  fetchedAt: new Date().toISOString(),
                  documents: {
                    deed: {
                      plotId,
                      coordinates: plotMetadata ? `(${plotMetadata.x}, ${plotMetadata.y})` : undefined,
                      level: plotMetadata?.level,
                      price: priceInXBGL,
                      currency: "xBGL",
                    }
                  }
                }
              };
            })
          );
          
          setPortfolioData({
            wallet: address,
            portfolio_type: "primary",
            holdings: blockchainHoldings,
            total_value: blockchainHoldings.length * 100,
            source: "blockchain"
          });
          console.log(`📊 Created portfolio from blockchain: ${blockchainHoldings.length} plots`);
        } else {
          setPortfolioData(null);
        }
      } catch (error: any) {
        console.debug("Failed to fetch portfolio:", error.message);
        setPortfolioData(null);
      }
    };
    fetchPortfolioData();
    const interval = setInterval(fetchPortfolioData, 30000);
    return () => clearInterval(interval);
  }, [address, allUserPlots]);

  const [marketView, setMarketView] = useState<"primary" | "secondary">("primary");
  const [created, setCreated] = useState<boolean>(() => {
    try {
      return localStorage.getItem("fh_created") === "1";
    } catch {
      return false;
    }
  });

  const [primaryPortfolio, setPrimaryPortfolio] = useState<any | null>(null);
  const [speculativePortfolio, setSpeculativePortfolio] = useState<any | null>(null);
  const [projection, setProjection] = useState<any | null>(null);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(0);

  const totalValue = useMemo(() => {
    if (primaryPortfolio?.holdings && primaryPortfolio.holdings.length > 0) {
      return primaryPortfolio.holdings.reduce((sum: number, holding: any) => {
        const costBasis = Number(holding.cost_basis) || 0;
        return sum + costBasis;
      }, 0);
    }
    return hookTotalValue || 0;
  }, [primaryPortfolio, hookTotalValue]);

  // Fetch xBGL balance
  useEffect(() => {
    const loadxBGLBalance = async () => {
      if (!address) {
        setCsnBalance("0");
        return;
      }
      try {
        const provider = getRpcProvider();
        if (provider) {
          const bal = await provider.getBalance(address);
          setCsnBalance(ethers.formatEther(bal));
        }
      } catch (error) {
        console.debug("Failed to load xBGL balance:", error);
      }
    };
    loadxBGLBalance();
    const interval = setInterval(loadxBGLBalance, 10000);
    return () => clearInterval(interval);
  }, [address]);

  // Auto-refresh plots
  useEffect(() => {
    if (address) {
      const timer = setTimeout(() => refreshPlots(), 1000);
      return () => clearTimeout(timer);
    }
  }, [address, refreshPlots]);

  // Fetch detailed portfolio data - Priority: Local DB > Backend > Blockchain
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!address) {
        setPortfolioData(null);
        setPrimaryPortfolio(null);
        setSpeculativePortfolio(null);
        return;
      }
      try {
        // Priority 1: Use local database portfolios
        if (portfolios && portfolios.length > 0) {
          const primaryPortfolioFromDB = portfolios.find((p: any) => p.portfolio_type === "primary" || !p.portfolio_type) || portfolios[0];
          const speculativePortfolioFromDB = portfolios.find((p: any) => p.portfolio_type === "secondary" || p.portfolio_type === "speculative");
          
          // Convert local DB portfolio to FinancialHub format
          const convertPortfolio = (p: any) => ({
            ...p,
            wallet: p.owner_wallet || p.wallet || address,
            portfolio_type: p.portfolio_type || "primary",
            holdings: p.holdings || [],
            total_value: p.total_value || p.current_value || 0,
            recurring_investment_monthly: p.recurring_investment_monthly || 0,
          });
          
          if (primaryPortfolioFromDB) {
            const converted = convertPortfolio(primaryPortfolioFromDB);
            setPrimaryPortfolio(converted);
            setPortfolioData(converted);
          }
          if (speculativePortfolioFromDB) {
            setSpeculativePortfolio(convertPortfolio(speculativePortfolioFromDB));
          }
          
          // Try to get projection from backend (non-blocking)
          projectPortfolio({ wallet: address }).then(proj => {
            if (!cancelled && proj) {
              setProjection(proj);
            }
          }).catch(() => {
            // Ignore projection errors
          });
          
          return;
        }

        // Priority 2: Try backend API (non-blocking, fallback)
        const [p, pPrimary, proj] = await Promise.all([
          getPortfolio(address).catch(() => null),
          getPortfolio(address, "primary").catch(() => null),
          projectPortfolio({ wallet: address }).catch(() => null),
        ]);

        if (!cancelled) {
          let primaryPortfolioData = null;

          // Handle backend responses
          if (p?.portfolios) {
            primaryPortfolioData = p.primary || p.portfolios.primary || pPrimary?.portfolio || null;
            setSpeculativePortfolio(p.speculative || p.portfolios.secondary || null);
            setPortfolioData(primaryPortfolioData);
          } else if (p?.portfolio) {
            const portfolio = p.portfolio;
            if (portfolio.portfolio_type === "primary") {
              primaryPortfolioData = portfolio;
              setPortfolioData(portfolio);
            } else {
              setSpeculativePortfolio(portfolio);
            }
          } else if (pPrimary?.portfolio) {
            primaryPortfolioData = pPrimary.portfolio;
            setPortfolioData(pPrimary.portfolio);
          } else {
            // Backend unavailable - use blockchain data if available
            // Use the detailed portfolio data from the first useEffect if available
            if (portfolioData && portfolioData.holdings && portfolioData.holdings.length > 0) {
              primaryPortfolioData = portfolioData;
            } else if (allUserPlots.length > 0) {
              // Fallback: create basic portfolio from plot IDs
              const blockchainPortfolio = {
                wallet: address,
                portfolio_type: "primary",
                holdings: allUserPlots.map(plotId => ({
                  asset_type: "plot",
                  identifier: String(plotId),
                  cost_basis: 100,
                  current_value: 100,
                  yield_annual: 0.05,
                  metadata: { 
                    plotId, 
                    source: "blockchain",
                    documents: {
                      deed: {
                        plotId,
                        price: 100,
                        currency: "xBGL",
                      }
                    }
                  }
                })),
                total_value: allUserPlots.length * 100,
                source: "blockchain"
              };
              primaryPortfolioData = blockchainPortfolio;
              setPortfolioData(blockchainPortfolio);
            }
          }
          
          if (proj) {
            setProjection(proj);
          }
          
          // Merge any additional plots from allUserPlots that aren't in the portfolio
          if (primaryPortfolioData && allUserPlots.length > 0) {
            const existingPlotIds = new Set(
              (primaryPortfolioData.holdings || [])
                .filter((h: any) => h.asset_type === "plot")
                .map((h: any) => parseInt(h.identifier, 10))
                .filter((id: number) => !isNaN(id))
            );
            
            const missingPlots = allUserPlots.filter(plotId => !existingPlotIds.has(plotId));
            
            if (missingPlots.length > 0) {
              // Fetch metadata for missing plots
              const { CONTRACT_ADDRESSES, PLOT_REGISTRY_ABI } = await import("@/lib/contracts");
              const provider = getRpcProvider();
              
              const additionalHoldings = await Promise.all(
                missingPlots.map(async (plotId) => {
                  let priceInXBGL = 100;
                  let plotMetadata = null;
                  
                  try {
                    if (provider && CONTRACT_ADDRESSES.plotRegistry) {
                      const contract = new ethers.Contract(
                        CONTRACT_ADDRESSES.plotRegistry,
                        PLOT_REGISTRY_ABI,
                        provider
                      );
                      const metadata = await contract.getPlotMetadata(plotId);
                      plotMetadata = {
                        x: Number(metadata.x),
                        y: Number(metadata.y),
                        level: Number(metadata.level),
                        issued: metadata.issued,
                        price: metadata.price,
                        planetId: metadata.planetId,
                      };
                      priceInXBGL = Number(ethers.formatEther(metadata.price));
                    }
                  } catch (e) {
                    console.debug(`Failed to fetch metadata for plot ${plotId}:`, e);
                  }
                  
                  return {
                    asset_type: "plot",
                    identifier: String(plotId),
                    cost_basis: priceInXBGL,
                    current_value: priceInXBGL,
                    yield_annual: 0.05,
                    metadata: {
                      plotId,
                      price: priceInXBGL,
                      contractMetadata: plotMetadata,
                      source: "blockchain",
                      fetchedAt: new Date().toISOString(),
                      documents: {
                        deed: {
                          plotId,
                          coordinates: plotMetadata ? `(${plotMetadata.x}, ${plotMetadata.y})` : undefined,
                          level: plotMetadata?.level,
                          price: priceInXBGL,
                          currency: "xBGL",
                        }
                      }
                    }
                  };
                })
              );
              
              // Merge holdings
              primaryPortfolioData = {
                ...primaryPortfolioData,
                holdings: [...(primaryPortfolioData.holdings || []), ...additionalHoldings],
                total_value: (primaryPortfolioData.total_value || 0) + additionalHoldings.reduce((sum, h) => sum + h.cost_basis, 0)
              };
              
              console.log(`📊 Merged ${additionalHoldings.length} additional plots into portfolio`);
            }
          }

          setPrimaryPortfolio(primaryPortfolioData);

          const primary = p?.primary || p?.portfolios?.primary || p?.portfolio || primaryPortfolioData;
          if (primary?.recurring_investment_monthly != null) {
            setMonthlyContribution(Number(primary.recurring_investment_monthly) || 0);
          }
          setProjection(proj || null);
        }
      } catch (error: any) {
        if (!cancelled) {
          console.debug("Failed to fetch portfolio data:", error.message);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [address, allUserPlots, portfolioData, portfolios]);

  // Animate cards on mount
  useEffect(() => {
    if (created && address) {
      animate(".anime-card", {
        opacity: [0, 1],
        translateY: [30, 0],
        delay: stagger(100),
        duration: 600,
        ease: "outExpo",
      });
    }
  }, [created, address]);

  if (!created && address) {
    return (
      <PortfolioWizard
        address={address}
        onComplete={() => setCreated(true)}
        onMarketViewChange={setMarketView}
      />
    );
  }

  return (
    <PortfolioDashboard
      address={address}
      portfolioData={portfolioData}
      primaryPortfolio={primaryPortfolio}
      speculativePortfolio={speculativePortfolio}
      totalValue={totalValue}
      csnBalance={csnBalance}
      monthlyContribution={monthlyContribution}
      projection={projection}
      marketView={marketView}
      onMarketViewChange={setMarketView}
    />
  );
}
