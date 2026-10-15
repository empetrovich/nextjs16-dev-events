'use client'

import posthog from 'posthog-js'

export default function ErrorTrackingTest() {
    return (
        <button
            onClick={() => {
                posthog.captureException(
                    new Error('PostHog test exception')
                )
            }}
        >
            Test PostHog error tracking
        </button>
    )
}