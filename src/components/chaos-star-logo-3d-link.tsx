import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CHAOS_STAR_LOGO_URL } from "@/lib/brand-logo-url";

const logoInner = (
  <span className="flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-xl bg-gradient-to-br from-purple-950/98 via-violet-950/98 to-black/92 p-1.5 shadow-lg">
    <img
      src={CHAOS_STAR_LOGO_URL}
      alt=""
      className="h-full w-full select-none object-contain"
      draggable={false}
    />
  </span>
);

/** Compact plate for header only — footer keeps {@link logoInner} */
const logoInnerNav = (
  <span className="flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-lg bg-gradient-to-br from-purple-950/98 via-violet-950/98 to-black/92 p-1 shadow-lg">
    <img
      src={CHAOS_STAR_LOGO_URL}
      alt=""
      className="h-full w-full select-none object-contain"
      draggable={false}
    />
  </span>
);

const linkClass =
  "child child-logo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/75 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

function LogoLink({ nav }: { nav?: boolean }) {
  return (
    <Link
      to="/"
      className={nav ? `${linkClass} child-logo--nav` : linkClass}
      aria-label="Chaos Star Universe home"
    >
      <span className="button btn-logo">{nav ? logoInnerNav : logoInner}</span>
    </Link>
  );
}

type ChaosStarLogo3DLinkProps = {
  variant: "nav" | "footer";
};

/**
 * Same markup and sizing as the footer brand logo: cosmic 3D plate + inner gradient badge.
 * Must be rendered inside {@link Cosmic3dShell}.
 */
export function ChaosStarLogo3DLink({ variant }: ChaosStarLogo3DLinkProps) {
  if (variant === "footer") {
    return (
      <div className="parent parent--logo">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35 }}
          className="flex"
        >
          <LogoLink />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="parent parent--logo parent--logo-inline">
      <div className="flex">
        <LogoLink nav />
      </div>
    </div>
  );
}
