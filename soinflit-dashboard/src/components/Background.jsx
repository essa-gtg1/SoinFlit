// Deep-space ambient field with slow bioluminescent mesh gradients (cyan, emerald, solar amber).
export default function Background() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[radial-gradient(130%_90%_at_50%_0%,#091326_0%,#060c1c_45%,#040814_80%)]"
    >
      <div className="blob anim-drift-a left-[-15vw] top-[-20vh] h-[70vh] w-[70vh] bg-[#00F2FE] opacity-[0.22]" />
      <div className="blob anim-drift-b right-[-20vw] top-[18vh] h-[80vh] w-[80vh] bg-[#059669] opacity-[0.26]" />
      <div className="blob anim-drift-c bottom-[-30vh] left-[20vw] h-[70vh] w-[70vh] bg-[#F59E0B] opacity-[0.14]" />
      <div className="blob anim-drift-b bottom-[10vh] left-[-20vw] h-[45vh] w-[45vh] bg-[#00F2FE] opacity-[0.12]" />
      <div className="bg-dots absolute inset-0 opacity-30 [mask-image:radial-gradient(ellipse_at_50%_30%,black,transparent_70%)]" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-b from-transparent to-[#040814]" />
    </div>
  )
}
