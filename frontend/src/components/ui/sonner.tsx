import { Toaster as SonnerToaster } from "sonner"

type ToasterProps = React.ComponentProps<typeof SonnerToaster>

/**
 * App-wide toast host. Dark, storybook-styled, top-center so it never
 * covers the primary action on learner screens.
 */
const Toaster = (props: ToasterProps) => (
  <SonnerToaster
    theme="dark"
    position="top-center"
    closeButton
    toastOptions={{
      classNames: {
        toast:
          "!rounded-2xl !border !border-white/20 !bg-green-950 !text-white !font-heading !shadow-story",
        title: "!font-bold",
        description: "!text-green-200",
        actionButton: "!rounded-lg !bg-pamana-gold !text-green-950 !font-bold",
        cancelButton: "!rounded-lg !bg-white/10 !text-white",
        closeButton: "!border-white/20 !bg-green-900 !text-white",
      },
    }}
    {...props}
  />
)

export { Toaster }
