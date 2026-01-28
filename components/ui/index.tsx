import * as React from "react"
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

// BUTTON
const buttonVariants = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
    size?: "default" | "sm" | "lg" | "icon"
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "default", size = "default", ...props }, ref) => {
        const variants = {
            default: "bg-primary text-primary-foreground hover:bg-primary/90",
            destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
            outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
            secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
            ghost: "hover:bg-accent hover:text-accent-foreground",
            link: "text-primary underline-offset-4 hover:underline",
        }
        const sizes = {
            default: "h-10 px-4 py-2",
            sm: "h-9 rounded-md px-3",
            lg: "h-11 rounded-md px-8",
            icon: "h-10 w-10",
        }
        return (
            <button
                className={cn(buttonVariants, variants[variant], sizes[size], className)}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

// INPUT
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { }

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Input.displayName = "Input"

// LABEL
export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
    ({ className, ...props }, ref) => (
        <label
            ref={ref}
            className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)}
            {...props}
        />
    )
)
Label.displayName = "Label"

// CARD
export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)} {...props} />
    )
)
Card.displayName = "Card"

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
    )
)
CardHeader.displayName = "CardHeader"

export const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
    ({ className, ...props }, ref) => (
        <h3 ref={ref} className={cn("text-2xl font-semibold leading-none tracking-tight", className)} {...props} />
    )
)
CardTitle.displayName = "CardTitle"

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
    ({ className, ...props }, ref) => (
        <p
            ref={ref}
            className={cn("text-sm text-muted-foreground", className)}
            {...props}
        />
    )
)
CardDescription.displayName = "CardDescription"

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
    )
)
CardContent.displayName = "CardContent"

// TEXTAREA
export interface TextareaProps
    extends React.TextareaHTMLAttributes<HTMLTextAreaElement> { }

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, ...props }, ref) => {
        return (
            <textarea
                className={cn(
                    "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Textarea.displayName = "Textarea"

// DIALOG (Simplified)
export const Dialog = ({ open, onOpenChange, children }: { open: boolean; onOpenChange: (open: boolean) => void; children: React.ReactNode }) => {
    if (!open) return null
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => onOpenChange(false)}>
            <div className="bg-background p-6 rounded-lg shadow-lg w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                {children}
            </div>
        </div>
    )
}
export const DialogContent = ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={cn("space-y-4", className)}>{children}</div>
export const DialogHeader = ({ children }: { children: React.ReactNode }) => <div className="space-y-2 text-center sm:text-left">{children}</div>
export const DialogTitle = ({ children }: { children: React.ReactNode }) => <h2 className="text-lg font-semibold">{children}</h2>
export const DialogDescription = ({ children }: { children: React.ReactNode }) => <p className="text-sm text-stone-500">{children}</p>
export const DialogFooter = ({ children }: { children: React.ReactNode }) => <div className="flex justify-end space-x-2">{children}</div>
export const DialogTrigger = ({ children, asChild, onClick }: any) => {
    return <div onClick={onClick} className="inline-block cursor-pointer">{children}</div>
}

// ALERT
export const Alert = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
    <div ref={ref} role="alert" className={cn("relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground", className)} {...props} />
))
Alert.displayName = "Alert"

export const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-sm [&_p]:leading-relaxed", className)} {...props} />
))
AlertDescription.displayName = "AlertDescription"

// SWITCH
export const Switch = React.forwardRef<HTMLButtonElement, any>(({ checked, onCheckedChange, ...props }, ref) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onCheckedChange?.(!checked)}
        className={cn("peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", checked ? "bg-primary" : "bg-stone-200")}
        ref={ref}
        {...props}
    >
        <span className={cn("pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform", checked ? "translate-x-4" : "translate-x-0")} />
    </button>
))
Switch.displayName = "Switch"

// BADGE
export const Badge = ({ className, variant = "default", ...props }: any) => {
    const variants = {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
    }
    // @ts-ignore
    const variantClass = variants[variant] || variants.default;

    return <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", variantClass, className)} {...props} />
}
