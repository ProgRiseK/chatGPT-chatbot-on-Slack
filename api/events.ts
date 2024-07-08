import { sendChatGPTresponse } from "./_chat"
import crypto from "crypto"

export const config = {max_duration: 30}

async function isValidSlackRequest(request: Request, body: any) {
    const signing_secret = process.env.SLACK_SIGNING_SECRET!
    const timestamp = request.headers.get("X-Slack-Request-Timestamp")!
    const slack_signature = request.headers.get("X-Slack-Signature")!
    const base = `v0:${timestamp}:${JSON.stringify(body)}`
    const hmac = crypto
        .createHmac("sha256", signing_secret)
        .update(base)
        .digest("hex")
    const computed_signature = `v0=${hmac}`
    
    return computed_signature === slack_signature

}

export async function POST(request: Request) {
    const raw_body = await request.text()
    const body = JSON.parse(raw_body)
    const request_type = body.type

    if(request_type === "url_verification") {
        return new Response(body.challenge, {status: 200})
    }

    if(await isValidSlackRequest(request, body)) {
        if(request_type === "event_callback") {
            const event_type = body.event.type
            if(event_type === "app_mention"){
                await sendChatGPTresponse(body.event)
                return new Response("Done!", {status: 200})
            }
        }
    }

    return new Response("OK", {status: 200})
}
