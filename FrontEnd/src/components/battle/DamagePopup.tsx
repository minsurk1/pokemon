import { motion } from "framer-motion";

export default function DamagePopup({ amount }: { amount: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 0, scale: 0.5 }}
      animate={{ opacity: 1, y: -40, scale: 1 }}
      exit={{ opacity: 0, y: -60 }}
      transition={{ duration: 0.6 }}
      style={{
        position: "absolute",
        color: "#ff3b3b",
        fontWeight: "900",
        fontSize: "22px",
        textShadow: "0 0 6px black",
        pointerEvents: "none",
      }}
    >
      -{amount}
    </motion.div>
  );
}
