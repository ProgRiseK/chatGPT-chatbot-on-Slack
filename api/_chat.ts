import { WebClient } from "@slack/web-api"
import { generatePrompt, getChatGPTResponse } from "./_openai"
import { stringify } from "querystring"

const slack = new WebClient(process.env.SLACK_BOT_TOKEN)

type Event = {
    channel: string
    timestamp: string
    thread_timestamp?: string
}

export async function sendChatGPTresponse(event: Event) {
    const {channel, timestamp, thread_timestamp} = event

    try {
        const thread = await slack.conversations.replies({
            channel,
            ts: thread_timestamp ?? timestamp,
            inclusive: true
        })

        const prompts = await generatePrompt(thread)
        const responseFromChatGPT = await getChatGPTResponse(prompts)

        await slack.chat.postMessage({
            channel,
            thread_ts: timestamp,
            text: `${responseFromChatGPT.choices[0].message.content}`,
        })
    } catch(error) {
        if(error instanceof Error){
            await slack.chat.postMessage({
                channel,
                thread_ts: timestamp,
                text: `<@${process.env.SLACK_ADMIN_NUMBER_ID}> Error: ${error.message}`,

            })

        }

    }

}
