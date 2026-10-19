import { Toaster as SonnerToaster } from "sonner"

type ToasterProps = React.ComponentProps<typeof SonnerToaster>

/**
 * App-wide toast host. Light sticker-styled, top-center so it never
 * covers the primary action on learner screens.
 */
const Toaster = (props: ToasterProps) => (
  <SonnerToaster
    theme="light"
    position="top-center"
    closeButton
    toastOptions={{
      classNames: {
        toast:
          "!rounded-2xl !border-4 !border-white !bg-white !text-[#2b5c3b] !font-heading !shadow-[0_8px_0_rgba(0,0,0,0.15)]",
        title: "!font-bold",
        description: "!text-[#5a7a63]",
        actionButton: "!rounded-lg !bg-[#4CAF50] !text-white !font-bold",
        cancelButton: "!rounded-lg !bg-[#e8f2e4] !text-[#2b5c3b] !font-bold",
        closeButton: "!border-[#d5e5d0] !bg-white !text-[#2b5c3b]",
      },
    }}
    {...props}
  />
)

export { Toaster }
