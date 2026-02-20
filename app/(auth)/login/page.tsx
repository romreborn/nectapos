'use client'

import { useFormStatus } from 'react-dom'
import { login } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import Image from 'next/image'

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <Button className="w-full" type="submit" disabled={pending}>
            {pending ? 'Signing in...' : 'Sign In'}
        </Button>
    )
}

export default function LoginPage() {
    async function clientAction(formData: FormData) {
        const result = await login(formData);
        if (result?.error) {
            toast.error(result.error);
        }
    }


    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-900 py-12">


            <Card className="w-full max-w-sm shadow-xl">
                <CardHeader className="space-y-1 text-center pb-2">
                    <div className="flex justify-center mb-2">
                        <div className="relative h-24 w-48">
                            <Image
                                src="/necta_logo.png"
                                alt="Necta POS"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                    </div>
                    <CardDescription>
                        Enter your credentials to access your store
                    </CardDescription>
                </CardHeader>
                <form action={clientAction}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="m@example.com"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" name="password" type="password" required />
                        </div>
                    </CardContent>
                    <CardFooter className="pt-6">
                        <SubmitButton />
                    </CardFooter>
                </form>
            </Card>

            {/* Demo Credentials Card */}
            <Card className="w-full max-w-sm mt-6 bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <CardContent className="pt-6">
                    <div className="text-center space-y-2">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            Demo Account Access
                        </p>
                        <div className="text-xs text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/40 p-3 rounded-md space-y-1">
                            <p>Email: <span className="font-mono font-bold select-all">kasir@demo.com</span></p>
                            <p>Password: <span className="font-mono font-bold select-all">demo123</span></p>
                        </div>
                        <p className="text-xs text-muted-foreground pt-2">
                            Feel free to explore the app with this demo account.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
