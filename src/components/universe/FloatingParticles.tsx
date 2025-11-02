import { motion } from 'framer-motion';

export function FloatingParticles() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-primary/20 rounded-full"
          initial={{ x: Math.random() * window.innerWidth, y: -10 }}
          animate={{ y: window.innerHeight + 10 }}
          transition={{ duration: 15 + Math.random() * 10, repeat: Infinity, ease: "linear" }}
          style={{ left: `${Math.random() * 100}%` }}
        />
      ))}
    </div>
  );
}
