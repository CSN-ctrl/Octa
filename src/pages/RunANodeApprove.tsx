import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { AppPageShell } from "@/components/layout/AppPageShell";
import { WalletConnectButton } from "@/components/WalletConnectButton";
import { NodeStatusBadge } from "@/components/node-approve/NodeStatusBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useWallet } from "@/contexts/WalletContext";
import {
  fetchChallengePublic,
  postChallengeReplace,
  postChallengeSign,
} from "@/lib/node-approve-api";
import { NODE_APPROVE_COPY, capNodeIdSuffix, capNodePickerTitle, friendlyNodePlatform } from "@/lib/node-approve-copy";
import type { CapNodeSummary, ChallengePublicPayload } from "@/lib/node-approve-contract";
import { PILOT_CHAIN_ID } from "@/lib/node-approve-contract";
import {
  domainMatchesPageHost,
  evaluatePreSignSafety,
  formatCountdown,
  parseChallengeChainId,
  secondsUntil,
  shortenHex,
} from "@/lib/node-approve-safety";
import { applyNodeApproveApiError } from "@/lib/node-approve-errors";
import {
  ensureWalletChain,
  personalSignRawMessage,
  resolveWalletProvider,
} from "@/lib/node-approve-wallet";
import { toast } from "sonner";

type UiPhase =
  | "loading"
  | "missing_id"
  | "load_error"
  | "terminal_expired"
  | "terminal_already_used"
  | "terminal_signed"
  | "domain_block"
  | "main"
  | "wrong_wallet"
  | "device_limit";

type DomainBlockKind = "allowlist" | "message_host";

export default function RunANodeApprove() {
  const [searchParams] = useSearchParams();
  const challengeId = searchParams.get("challenge")?.trim() ?? "";
  const { address, isConnected, provider } = useWallet();

  const [challenge, setChallenge] = useState<ChallengePublicPayload | null>(null);
  const [phase, setPhase] = useState<UiPhase>("loading");
  const [countdownSec, setCountdownSec] = useState(0);
  const [busy, setBusy] = useState(false);
  const [capNodes, setCapNodes] = useState<CapNodeSummary[]>([]);
  const [selectedReplaceId, setSelectedReplaceId] = useState<string>("");
  const [firstSignature, setFirstSignature] = useState<string | null>(null);
  const [awaitingResign, setAwaitingResign] = useState(false);
  const [copied, setCopied] = useState(false);
  const [domainBlockKind, setDomainBlockKind] = useState<DomainBlockKind>("allowlist");

  const pageHost = typeof window !== "undefined" ? window.location.host : "";

  const safety = useMemo(() => {
    if (!challenge) return null;
    return evaluatePreSignSafety({
      domain: challenge.domain,
      pageHost,
      chainId: challenge.chain_id,
      message: challenge.message,
      messageAddress: challenge.address,
      connectedAddress: address,
    });
  }, [challenge, pageHost, address]);

  const domainBlocked = useMemo(() => {
    if (!challenge) return false;
    return !domainMatchesPageHost(challenge.domain, pageHost);
  }, [challenge, pageHost]);

  const loadChallenge = useCallback(async () => {
    if (!challengeId) {
      setPhase("missing_id");
      return;
    }
    setPhase("loading");
    try {
      const payload = await fetchChallengePublic(challengeId);
      setChallenge(payload);
      setCountdownSec(secondsUntil(payload.expires_at));
      if (payload.state === "expired") setPhase("terminal_expired");
      else if (payload.state === "already_used") setPhase("terminal_already_used");
      else if (payload.state === "signed") setPhase("terminal_signed");
      else if (!domainMatchesPageHost(payload.domain, pageHost)) {
        setDomainBlockKind("message_host");
        setPhase("domain_block");
      } else setPhase("main");
    } catch (err) {
      applyNodeApproveApiError(err, {
        onPhase: (p, nodes) => {
          if (p === "domain_block") setDomainBlockKind("allowlist");
          if (p === "device_limit" && nodes?.length) setCapNodes(nodes);
          setPhase(p);
        },
        onGeneric: () => setPhase("load_error"),
      }) || setPhase("load_error");
    }
  }, [challengeId, pageHost]);

  useEffect(() => {
    void loadChallenge();
  }, [loadChallenge]);

  useEffect(() => {
    if (!challenge?.expires_at) return;
    const tick = () => setCountdownSec(secondsUntil(challenge.expires_at));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [challenge?.expires_at]);

  useEffect(() => {
    if (countdownSec === 0 && challenge?.state === "pending" && phase === "main") {
      setPhase("terminal_expired");
    }
  }, [countdownSec, challenge?.state, phase]);

  const copyDeviceKey = async () => {
    if (!challenge?.device_pubkey) return;
    try {
      await navigator.clipboard.writeText(challenge.device_pubkey);
      setCopied(true);
      toast.success(NODE_APPROVE_COPY.copied);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(NODE_APPROVE_COPY.copyClipboardError);
    }
  };

  const runSignAndSubmit = async () => {
    if (!challenge || !challengeId || domainBlocked) return;

    const pre = evaluatePreSignSafety({
      domain: challenge.domain,
      pageHost,
      chainId: challenge.chain_id,
      message: challenge.message,
      messageAddress: challenge.address,
      connectedAddress: address,
    });
    if (pre.ok === false) {
      if (pre.reason === "wrong_wallet") setPhase("wrong_wallet");
      else if (pre.reason === "domain_mismatch") {
        setDomainBlockKind("message_host");
        setPhase("domain_block");
      }
      return;
    }

    const targetChain = parseChallengeChainId(challenge.chain_id) ?? PILOT_CHAIN_ID;
    const eip = resolveWalletProvider(provider);
    if (!eip || !address) {
      toast.error(NODE_APPROVE_COPY.connectWalletCta);
      return;
    }

    setBusy(true);
    try {
      const switched = await ensureWalletChain(eip, targetChain);
      if (!switched) {
        toast.error(NODE_APPROVE_COPY.chainMismatchBody);
        return;
      }

      const signature = await personalSignRawMessage(eip, address, challenge.message);
      setFirstSignature((prev) => prev ?? signature);

      await postChallengeSign(challengeId, signature);
      setPhase("terminal_signed");
    } catch (err) {
      const handled = applyNodeApproveApiError(err, {
        onPhase: (p, nodes) => {
          if (p === "domain_block") setDomainBlockKind("allowlist");
          if (p === "device_limit" && nodes?.length) setCapNodes(nodes);
          setPhase(p);
        },
        onGeneric: (message) => toast.error(message),
      });
      if (!handled) {
        toast.error(err instanceof Error ? err.message : NODE_APPROVE_COPY.genericApiError);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleReplaceAndResign = async () => {
    if (!challengeId || !selectedReplaceId || !firstSignature) return;
    setBusy(true);
    try {
      const reissued = await postChallengeReplace(challengeId, selectedReplaceId, firstSignature);
      setChallenge((prev) =>
        prev
          ? {
              ...prev,
              message: reissued.message,
              expires_at: reissued.expires_at,
              nonce: reissued.nonce,
              state: "pending",
            }
          : prev,
      );
      setCountdownSec(secondsUntil(reissued.expires_at));
      setAwaitingResign(true);
      setPhase("main");
      toast.message(NODE_APPROVE_COPY.replaceFlowResign);
    } catch (err) {
      applyNodeApproveApiError(err, {
        onPhase: (p) => {
          if (p === "domain_block") setDomainBlockKind("allowlist");
          setPhase(p);
        },
        onGeneric: (message) => toast.error(message),
      }) ||
        toast.error(err instanceof Error ? err.message : NODE_APPROVE_COPY.genericApiError);
    } finally {
      setBusy(false);
    }
  };

  const showWrongWallet =
    phase === "wrong_wallet" || (safety?.ok === false && safety.reason === "wrong_wallet" && isConnected);

  const canSign =
    challenge?.state === "pending" &&
    !domainBlocked &&
    phase !== "device_limit" &&
    !showWrongWallet &&
    countdownSec > 0;

  return (
    <AppPageShell innerClassName="max-w-lg mx-auto py-10">
      <div className="space-y-6">
        <div className="space-y-1 text-center sm:text-left">
          <h1 className="text-2xl font-semibold tracking-tight">{NODE_APPROVE_COPY.pageTitle}</h1>
          <p className="text-sm text-muted-foreground">{NODE_APPROVE_COPY.pageDescription}</p>
        </div>

        {phase === "loading" && (
          <Card>
            <CardContent className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              {NODE_APPROVE_COPY.loadingApproval}
            </CardContent>
          </Card>
        )}

        {phase === "missing_id" && (
          <TerminalCard
            icon={<AlertCircle className="h-5 w-5 text-destructive" />}
            title={NODE_APPROVE_COPY.invalidLinkTitle}
            body={NODE_APPROVE_COPY.missingChallenge}
          />
        )}

        {phase === "load_error" && (
          <TerminalCard
            icon={<AlertCircle className="h-5 w-5 text-destructive" />}
            title={NODE_APPROVE_COPY.unavailableTitle}
            body={NODE_APPROVE_COPY.loadError}
            action={
              <Button variant="outline" onClick={() => void loadChallenge()}>
                {NODE_APPROVE_COPY.tryAgainButton}
              </Button>
            }
          />
        )}

        {phase === "domain_block" && (
          <TerminalCard
            icon={<ShieldAlert className="h-5 w-5 text-destructive" />}
            title={
              domainBlockKind === "message_host"
                ? NODE_APPROVE_COPY.domainMismatchTitle
                : NODE_APPROVE_COPY.domainNotAllowedTitle
            }
            body={
              domainBlockKind === "message_host"
                ? NODE_APPROVE_COPY.domainMismatchBody
                : NODE_APPROVE_COPY.domainNotAllowedBody
            }
          />
        )}

        {phase === "terminal_expired" && (
          <TerminalCard
            icon={<Clock className="h-5 w-5 text-muted-foreground" />}
            title={NODE_APPROVE_COPY.expiredTitle}
            body={NODE_APPROVE_COPY.expiredBody}
          />
        )}

        {phase === "terminal_already_used" && (
          <TerminalCard
            icon={<CheckCircle2 className="h-5 w-5 text-muted-foreground" />}
            title={NODE_APPROVE_COPY.alreadyUsedTitle}
            body={NODE_APPROVE_COPY.alreadyUsedBody}
          />
        )}

        {phase === "terminal_signed" && (
          <TerminalCard
            icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
            title={NODE_APPROVE_COPY.successTitle}
            body={NODE_APPROVE_COPY.successBody}
          />
        )}

        {phase === "device_limit" && (
          <Card>
            <CardHeader>
              <CardTitle>{NODE_APPROVE_COPY.deviceLimitTitle}</CardTitle>
              <CardDescription>{NODE_APPROVE_COPY.deviceLimitBody}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>{NODE_APPROVE_COPY.replaceNotice}</AlertDescription>
              </Alert>
              <RadioGroup value={selectedReplaceId} onValueChange={setSelectedReplaceId}>
                {capNodes.map((node) => (
                  <div key={node.id} className="flex items-start gap-3 rounded-lg border p-3">
                    <RadioGroupItem value={node.id} id={`node-${node.id}`} className="mt-1" />
                    <Label htmlFor={`node-${node.id}`} className="flex-1 cursor-pointer space-y-1.5">
                      <span className="font-medium block">{capNodePickerTitle(node)}</span>
                      <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {NODE_APPROVE_COPY.lastSeenLabel}{" "}
                        {formatDistanceToNow(new Date(node.last_seen_at), { addSuffix: true })}
                        <NodeStatusBadge status={node.status} />
                        <span className="font-mono">
                          {NODE_APPROVE_COPY.nodeIdSuffixPrefix}
                          {capNodeIdSuffix(node.id)}
                        </span>
                      </span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              <Button
                className="w-full"
                disabled={!selectedReplaceId || busy}
                onClick={() => void handleReplaceAndResign()}
              >
                {NODE_APPROVE_COPY.deviceLimitConfirm}
              </Button>
            </CardContent>
          </Card>
        )}

        {(phase === "main" || showWrongWallet) && challenge && (
          <Card>
            <CardHeader>
              <CardTitle>{NODE_APPROVE_COPY.approveHeading}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Clock className="h-4 w-4" aria-hidden />
                <span>
                  {NODE_APPROVE_COPY.expiresInLabel}{" "}
                  <span className="font-mono tabular-nums">
                    {countdownSec > 0 ? formatCountdown(countdownSec) : NODE_APPROVE_COPY.expiredInline}
                  </span>
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <dl className="grid gap-3 text-sm">
                <Row
                  label={NODE_APPROVE_COPY.platformLabel}
                  value={friendlyNodePlatform(challenge.platform)}
                />
                <Row label={NODE_APPROVE_COPY.appVersionLabel} value={challenge.app_version} />
                {challenge.device_pubkey ? (
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <dt className="text-muted-foreground">{NODE_APPROVE_COPY.deviceKeyLabel}</dt>
                    <dd className="flex items-center gap-2 font-mono text-xs">
                      <span aria-label={challenge.device_pubkey}>
                        {shortenHex(challenge.device_pubkey, 8, 6)}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1"
                        onClick={() => void copyDeviceKey()}
                      >
                        <Copy className="h-3.5 w-3.5" aria-hidden />
                        {copied ? NODE_APPROVE_COPY.copied : NODE_APPROVE_COPY.copyDeviceKey}
                      </Button>
                    </dd>
                  </div>
                ) : null}
                <Row
                  label={NODE_APPROVE_COPY.walletLabel}
                  value={shortenHex(challenge.address, 6, 4)}
                  mono
                />
              </dl>

              <Collapsible>
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted/50">
                  {NODE_APPROVE_COPY.exactMessageHeading}
                  <ChevronDown className="h-4 w-4" aria-hidden />
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <p className="mb-2 text-xs text-muted-foreground">{NODE_APPROVE_COPY.exactMessageHint}</p>
                  <pre className="max-h-64 overflow-auto rounded-md bg-muted p-3 text-xs whitespace-pre-wrap break-all">
                    {challenge.message}
                  </pre>
                </CollapsibleContent>
              </Collapsible>

              {awaitingResign ? (
                <Alert>
                  <AlertDescription>{NODE_APPROVE_COPY.replaceFlowResign}</AlertDescription>
                </Alert>
              ) : null}

              {showWrongWallet ? (
                <Alert variant="destructive">
                  <AlertTitle>{NODE_APPROVE_COPY.wrongWalletTitle}</AlertTitle>
                  <AlertDescription>{NODE_APPROVE_COPY.wrongWalletBody}</AlertDescription>
                </Alert>
              ) : null}

              {!isConnected ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{NODE_APPROVE_COPY.connectWalletCta}</p>
                  <WalletConnectButton className="w-full" />
                </div>
              ) : (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <WalletConnectButton className="flex-1" />
                  <Button
                    className="flex-1"
                    disabled={!canSign || busy}
                    onClick={() => void runSignAndSubmit()}
                  >
                    {busy ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                        {NODE_APPROVE_COPY.signing}
                      </>
                    ) : (
                      NODE_APPROVE_COPY.approveCta
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppPageShell>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={mono ? "font-mono text-xs" : ""}>{value}</dd>
    </div>
  );
}

function TerminalCard({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {icon}
          {title}
        </CardTitle>
        <CardDescription>{body}</CardDescription>
      </CardHeader>
      {action ? <CardContent>{action}</CardContent> : null}
    </Card>
  );
}
