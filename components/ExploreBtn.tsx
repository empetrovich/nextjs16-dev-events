'use client';

import Image from "next/image";
import posthog from "posthog-js";
import { posthogLogs } from "@/lib/posthog-logs";

const ExploreBtn = () => {
    return (
        <button
            type="button"
            id="explore-btn"
            className="mt-7 mx-auto"
            onClick={() => {
                posthog.capture("events_explored");
                posthogLogs.info("event directory exploration started", {
                    action: "events_explored",
                });
            }}
        >ExploreBtn
            <a href={"#events"}>
                Explore Events
                <Image className="w-auto" src="/icons/arrow-down.svg" alt="arrow-down" width={14} height={14} />
            </a>
        </button>
    )
}
export default ExploreBtn
