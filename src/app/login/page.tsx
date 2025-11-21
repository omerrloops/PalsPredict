'use client'

import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
    const handleLogin = async () => {
        const supabase = createClient()
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${location.origin}/auth/callback`,
            },
        })
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-24">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-bold tracking-tight">
                        Welcome to PalsPredict
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Sign in to start predicting with your friends
                    </p>
                </div>
                <div className="mt-8 space-y-6">
                    <button
                        onClick={handleLogin}
                        className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        Sign in with Google
                    </button>
                </div>
            </div>
        </div>
    )
}
